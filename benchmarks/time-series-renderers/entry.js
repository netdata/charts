import makeDefaultSDK from "@/makeDefaultSDK"
import {
  disposeWebGPURuntime,
  getWebGPURuntime,
} from "@/chartLibraries/webgpu/runtime"

const width = 1600
const height = 500
const intervalMs = 1000

const quantile = (values, fraction) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))]
}

const summarize = values => ({
  count: values.length,
  min: Math.min(...values),
  median: quantile(values, 0.5),
  p95: quantile(values, 0.95),
  max: Math.max(...values),
})

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))
const measureFrameInterval = async () => {
  const timestamps = []
  for (let index = 0; index < 8; index++) {
    timestamps.push(await new Promise(resolve => requestAnimationFrame(resolve)))
  }
  return quantile(
    timestamps.slice(1).map((timestamp, index) => timestamp - timestamps[index]),
    0.5
  )
}
const collectMemory = () => performance.memory?.usedJSHeapSize ?? null

const forceGc = async () => {
  if (typeof window.gc === "function") window.gc()
  await new Promise(resolve => setTimeout(resolve, 25))
  if (typeof window.gc === "function") window.gc()
}

const makeData = (dimensions, points, revision) => {
  const start = 1783630694000
  return Array.from({ length: points }, (_, pointIndex) => {
    const row = new Array(dimensions + 1)
    row[0] = start + pointIndex * intervalMs

    for (let dimensionIndex = 0; dimensionIndex < dimensions; dimensionIndex++) {
      const phase = pointIndex * 0.017 + dimensionIndex * 0.031 + revision * 0.13
      row[dimensionIndex + 1] = Math.sin(phase) * 70 + Math.cos(phase * 0.37) * 20
    }
    return row
  })
}

const makeChart = state => {
  const chart = state.sdk.makeChart()
  state.sdk.appendChild(chart)

  let revision = 0
  chart.getPayload = () => ({
    labels: ["time", ...state.ids],
    data: state.datasets[revision],
    all: [],
    tree: {},
  })
  chart.updateAttributes({
    chartType: "line",
    loaded: true,
    loading: false,
    processing: false,
    panning: false,
    highlighting: false,
    outOfLimits: false,
    min: -90,
    max: 90,
    valueRange: [-90, 90],
    viewDimensions: {
      ids: state.ids,
      names: state.ids,
      count: state.ids.length,
      priorities: state.ids.map((_, index) => index),
      grouped: state.ids.map(() => "dimension"),
      units: state.ids.map(() => "units"),
      contexts: state.ids.map(() => "benchmark.context"),
      sts: state.ids.map(() => 0),
      algorithm: "absolute",
    },
  })
  chart.updateDimensions()
  chart.reconcileChartLibrary()

  if (chart.getAttribute("chartLibrary") !== state.renderer) {
    throw new Error(`Expected ${state.renderer} but routed to ${chart.getAttribute("chartLibrary")}`)
  }

  const element = document.createElement("div")
  element.style.width = `${width}px`
  element.style.height = `${height}px`
  document.body.appendChild(element)

  return {
    chart,
    element,
    get ui() {
      return chart.getUI()
    },
    setRevision: nextRevision => {
      revision = nextRevision
    },
    destroy: () => {
      chart.getUI().unmount()
      state.sdk.removeChild(chart.getId())
      element.remove()
    },
  }
}

const settle = async (instance, startedAt = performance.now()) => {
  await instance.ui.whenReady?.()
  if (instance.chart.getAttribute("chartLibrary") !== prepared.renderer) {
    throw new Error(`Renderer fell back to ${instance.chart.getAttribute("chartLibrary")}`)
  }
  await instance.ui.getQueueDone?.()
  const workCompletionMs = performance.now() - startedAt
  await nextFrame()
  return { workCompletionMs, frameMs: performance.now() - startedAt }
}

let prepared = null
let preview = null

const prepare = async ({ renderer, dimensions, points, gaps = false }) => {
  if (prepared) throw new Error("Benchmark state already prepared")
  if (renderer !== "dygraph" && renderer !== "webgpu") throw new Error("Unknown renderer")

  const datasets = [makeData(dimensions, points, 0), makeData(dimensions, points, 1)]
  if (gaps && points > 2) {
    const gapIndex = Math.floor(points / 2)
    datasets.forEach(data => {
      data[gapIndex][1] = null
    })
  }
  const sdk = makeDefaultSDK({
    on: {
      rendererFallback: (chart, failedRenderer, error) => {
        console.error(`${failedRenderer} fallback: ${error?.stack || error}`)
      },
    },
    attributes: {
      autofetch: false,
      after: datasets[0][0][0] / 1000,
      before: datasets[0][points - 1][0] / 1000,
      chartLibrariesByType: { line: renderer },
    },
  })
  prepared = {
    renderer,
    dimensions,
    points,
    ids: Array.from({ length: dimensions }, (_, index) => `series-${index}`),
    datasets,
    sdk,
    runtime: null,
    runtimeLease: false,
  }

  let coldRuntimeMs = null
  let adapterInfo = null
  if (renderer === "webgpu") {
    prepared.runtime = getWebGPURuntime(sdk)
    const startedAt = performance.now()
    await prepared.runtime.acquire()
    coldRuntimeMs = performance.now() - startedAt
    prepared.runtimeLease = true
    const { info = {} } = prepared.runtime.adapter
    adapterInfo = {
      vendor: info.vendor || null,
      architecture: info.architecture || null,
      device: info.device || null,
      description: info.description || null,
    }
  }

  await forceGc()
  const displayFrameIntervalMs = await measureFrameInterval()
  return {
    renderer,
    dimensions,
    points,
    values: dimensions * points,
    coldRuntimeMs,
    adapterInfo,
    displayFrameIntervalMs,
    memoryBefore: collectMemory(),
  }
}

const measure = async ({ mountSamples = 3, updateSamples = 10, sustainedMs = 3000 } = {}) => {
  if (!prepared) throw new Error("Benchmark state has not been prepared")

  let pipelineWarmupMs = null
  if (prepared.renderer === "webgpu") {
    const warmup = makeChart(prepared)
    const startedAt = performance.now()
    warmup.ui.mount(warmup.element)
    await settle(warmup)
    pipelineWarmupMs = performance.now() - startedAt
    warmup.destroy()
    await forceGc()
  }

  const mountSync = []
  const mountWorkCompletion = []
  const mountFrame = []
  for (let index = 0; index < mountSamples; index++) {
    const instance = makeChart(prepared)
    await nextFrame()
    const startedAt = performance.now()
    instance.ui.mount(instance.element)
    mountSync.push(performance.now() - startedAt)
    const settlement = await settle(instance, startedAt)
    mountWorkCompletion.push(settlement.workCompletionMs)
    mountFrame.push(settlement.frameMs)
    instance.destroy()
    await forceGc()
  }

  const instance = makeChart(prepared)
  instance.ui.mount(instance.element)
  await settle(instance)
  let peakMemory = collectMemory()

  for (let index = 0; index < 2; index++) {
    instance.setRevision((index + 1) % 2)
    instance.ui.invalidateRender()
    instance.ui.render()
    await settle(instance)
  }

  const updateSync = []
  const updateWorkCompletion = []
  const updateFrame = []
  for (let index = 0; index < updateSamples; index++) {
    instance.setRevision(index % 2)
    instance.ui.invalidateRender()
    const startedAt = performance.now()
    instance.ui.render()
    updateSync.push(performance.now() - startedAt)
    const settlement = await settle(instance, startedAt)
    updateWorkCompletion.push(settlement.workCompletionMs)
    updateFrame.push(settlement.frameMs)
    peakMemory = Math.max(peakMemory || 0, collectMemory() || 0)
  }

  const sustainedDurations = []
  const sustainedStartedAt = performance.now()
  let sustainedUpdates = 0
  while (performance.now() - sustainedStartedAt < sustainedMs) {
    instance.setRevision(sustainedUpdates % 2)
    instance.ui.invalidateRender()
    const updateStartedAt = performance.now()
    instance.ui.render()
    await settle(instance)
    sustainedDurations.push(performance.now() - updateStartedAt)
    sustainedUpdates += 1
    peakMemory = Math.max(peakMemory || 0, collectMemory() || 0)
  }
  const sustainedElapsedMs = performance.now() - sustainedStartedAt
  const gpuBufferBytes = instance.ui.getBufferBytes?.() || 0

  instance.destroy()
  await forceGc()
  const retainedMemory = collectMemory()

  return {
    renderer: prepared.renderer,
    dimensions: prepared.dimensions,
    points: prepared.points,
    values: prepared.dimensions * prepared.points,
    canvas: { width, height, devicePixelRatio: window.devicePixelRatio },
    pipelineWarmupMs,
    mountSyncMs: summarize(mountSync),
    mountWorkCompletionMs: summarize(mountWorkCompletion),
    mountFrameMs: summarize(mountFrame),
    updateSyncMs: summarize(updateSync),
    updateWorkCompletionMs: summarize(updateWorkCompletion),
    updateFrameMs: summarize(updateFrame),
    sustained: {
      elapsedMs: sustainedElapsedMs,
      updates: sustainedUpdates,
      updatesPerSecond: (sustainedUpdates * 1000) / sustainedElapsedMs,
      updateFrameMs: summarize(sustainedDurations),
      missedFrameBudget: sustainedDurations.filter(value => value > 1000 / 60).length,
    },
    gpuBufferBytes,
    peakMemory,
    retainedMemory,
  }
}

const mountPreview = async ({ stepped = false, visibleDimensionIds = null } = {}) => {
  if (!prepared) throw new Error("Benchmark state has not been prepared")
  if (preview) throw new Error("Preview is already mounted")

  preview = makeChart(prepared)
  preview.chart.updateAttribute("stepPlot", stepped)
  if (visibleDimensionIds) {
    preview.chart.updateAttribute("selectedLegendDimensions", visibleDimensionIds)
  }
  preview.ui.mount(preview.element)
  await settle(preview)
  return {
    renderer: preview.chart.getAttribute("chartLibrary"),
    canvas: preview.ui.getCanvas?.()?.dataset.renderer || "dygraph",
    runtimeReferences: prepared.runtime?.references || 0,
  }
}

const exerciseDeviceLossFallback = async () => {
  if (!preview || !prepared?.runtime?.device) throw new Error("A WebGPU preview is required")

  prepared.runtime.device.destroy()
  const deadline = performance.now() + 2000
  while (preview.chart.getAttribute("chartLibrary") === "webgpu" && performance.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }

  return {
    renderer: preview.chart.getAttribute("chartLibrary"),
    hasDygraph: Boolean(preview.ui.getDygraph?.()),
  }
}

const cleanup = async () => {
  preview?.destroy()
  preview = null
  if (prepared?.runtimeLease) prepared.runtime.release()
  if (prepared?.sdk) disposeWebGPURuntime(prepared.sdk)
  prepared = null
  document.body.replaceChildren()
  await forceGc()
}

window.__NETDATA_RENDERER_BENCHMARK__ = {
  prepare,
  measure,
  mountPreview,
  exerciseDeviceLossFallback,
  cleanup,
}
