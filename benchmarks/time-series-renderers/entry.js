import makeDefaultSDK from "@/makeDefaultSDK"
import {
  disposeWebGPURuntime,
  getWebGPURuntime,
} from "@/chartLibraries/webgpu/runtime"
import {
  disposeWebGL2Runtime,
  getActiveWebGL2Contexts,
  getWebGL2Runtime,
} from "@/chartLibraries/webgl2/engine/runtime"

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
const setStatus = message => {
  const status = document.getElementById("benchmark-status")
  if (status) status.textContent = message
}

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
  chart.on("rendererFallback", (failedRenderer, error) => {
    state.fallbackErrors.push(`${failedRenderer} fallback: ${error?.stack || error}`)
  })
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
  element.dataset.benchmarkChart = "true"
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
    const runtimeFailure = prepared.runtime?.lastFailure
    throw new Error(
      prepared.fallbackErrors.at(-1) ||
        (runtimeFailure && `${runtimeFailure.reason}: ${runtimeFailure.message}`) ||
        `Renderer fell back to ${instance.chart.getAttribute("chartLibrary")}`
    )
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
  if (!new Set(["dygraph", "webgpu", "webgl2"]).has(renderer))
    throw new Error("Unknown renderer")

  setStatus(`Preparing ${renderer}: ${dimensions * points} values`)
  const datasets = [makeData(dimensions, points, 0), makeData(dimensions, points, 1)]
  if (gaps && points > 2) {
    const gapIndex = Math.floor(points / 2)
    datasets.forEach(data => {
      data[gapIndex][1] = null
    })
  }
  const fallbackErrors = []
  const sdk = makeDefaultSDK({
    on: {
      rendererFallback: (chart, failedRenderer, error) => {
        const message = `${failedRenderer} fallback: ${error?.stack || error}`
        fallbackErrors.push(message)
        console.error(message)
      },
    },
    attributes: {
      autofetch: false,
      after: datasets[0][0][0] / 1000,
      before: datasets[0][points - 1][0] / 1000,
      chartRenderersByVisualization: { line: renderer },
    },
  })
  prepared = {
    renderer,
    dimensions,
    points,
    gaps,
    ids: Array.from({ length: dimensions }, (_, index) => `series-${index}`),
    datasets,
    sdk,
    runtime: null,
    runtimeLease: false,
    fallbackErrors,
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
  } else if (renderer === "webgl2") {
    prepared.runtime = getWebGL2Runtime(sdk)
    const startedAt = performance.now()
    await prepared.runtime.acquire()
    coldRuntimeMs = performance.now() - startedAt
    prepared.runtimeLease = true
    adapterInfo = prepared.runtime.info
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

const measureMultiChart = async (count = 4) => {
  if (prepared.renderer === "dygraph") return null
  const instances = Array.from({ length: count }, () => makeChart(prepared))
  const mountStartedAt = performance.now()
  instances.forEach(instance => instance.ui.mount(instance.element))
  await Promise.all(instances.map(instance => instance.ui.whenReady()))
  if (
    instances.some(
      instance => instance.chart.getAttribute("chartLibrary") !== prepared.renderer
    )
  )
    throw new Error(`A multi-chart ${prepared.renderer} instance failed`)
  await Promise.all(instances.map(instance => instance.ui.getQueueDone()))
  await nextFrame()
  const mountMs = performance.now() - mountStartedAt
  const resourceReferencesDuring = prepared.runtime.references

  const updateStartedAt = performance.now()
  instances.forEach(instance => {
    instance.setRevision(1)
    instance.ui.invalidateRender()
    instance.ui.render()
  })
  await Promise.all(instances.map(instance => instance.ui.getQueueDone()))
  await nextFrame()
  const updateMs = performance.now() - updateStartedAt
  const gpuBufferBytes = instances.reduce(
    (total, instance) => total + (instance.ui.getBufferBytes?.() || 0),
    0
  )

  instances.forEach(instance => instance.destroy())
  const resourceReferencesAfter = prepared.runtime.references
  return {
    count,
    mountMs,
    updateMs,
    gpuBufferBytes,
    resourceReferencesDuring,
    resourceReferencesAfter,
  }
}

const measure = async ({ mountSamples = 3, updateSamples = 10, sustainedMs = 3000 } = {}) => {
  if (!prepared) throw new Error("Benchmark state has not been prepared")
  setStatus(`Running ${prepared.renderer}: ${prepared.dimensions * prepared.points} values`)

  let pipelineWarmupMs = null
  if (prepared.renderer !== "dygraph") {
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
  const exportCanvas = instance.ui.getCanvas?.() || instance.element.querySelector("canvas")
  const exportDataUrlBytes = exportCanvas?.toDataURL("image/png").length || 0

  instance.destroy()
  const multiChart = await measureMultiChart()
  await forceGc()
  const retainedMemory = collectMemory()

  setStatus(`Completed ${prepared.renderer}: ${prepared.dimensions * prepared.points} values`)
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
    exportDataUrlBytes,
    multiChart,
    peakMemory,
    retainedMemory,
  }
}

const mountPreview = async ({
  stepped = false,
  visibleDimensionIds = null,
  enabledXAxis,
  enabledYAxis,
} = {}) => {
  if (!prepared) throw new Error("Benchmark state has not been prepared")
  if (preview) throw new Error("Preview is already mounted")

  preview = makeChart(prepared)
  preview.chart.updateAttribute("stepPlot", stepped)
  if (enabledXAxis !== undefined) preview.chart.updateAttribute("enabledXAxis", enabledXAxis)
  if (enabledYAxis !== undefined) preview.chart.updateAttribute("enabledYAxis", enabledYAxis)
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

const inspectPreview = () => {
  if (!preview) throw new Error("A preview is required")
  const xAxisRange = preview.ui.getXAxisRange?.() || null
  return {
    plotArea: preview.ui.getPlotArea?.() || null,
    xAxisRange,
    xCoords: xAxisRange?.map(value => preview.ui.getXCoord?.(value)) || null,
    hoverX: preview.chart.getAttribute("hoverX"),
    clickX: preview.chart.getAttribute("clickX"),
    navigation: preview.chart.getAttribute("navigation"),
    panning: preview.chart.getAttribute("panning"),
    enabledHover: preview.chart.getAttribute("enabledHover"),
  }
}

const capturePreview = async () => {
  if (!preview) throw new Error("A preview is required")
  const canvas = preview.ui.getCanvas?.()
  if (!canvas) throw new Error("The preview has no canvas")
  const dataUrl = canvas.toDataURL("image/png")
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const copy = document.createElement("canvas")
  copy.width = canvas.width
  copy.height = canvas.height
  const context = copy.getContext("2d")
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, copy.width, copy.height).data
  let nonTransparentPixels = 0
  for (let offset = 3; offset < pixels.length; offset += 4) {
    if (pixels[offset]) nonTransparentPixels += 1
  }

  const plot = preview.ui.getPlotArea?.()
  const dpr = window.devicePixelRatio || 1
  const gapIndex = Math.floor(prepared.points / 2)
  const gapX = plot
    ? Math.round((plot.left + (plot.width * gapIndex) / (prepared.points - 1)) * dpr)
    : null
  const spacing = plot ? (plot.width * dpr) / Math.max(prepared.points - 1, 1) : 0
  const gapHalfWidth = Math.max(1, Math.floor(spacing * 0.35))
  let gapBandNonTransparentPixels = null
  if (gapX !== null) {
    gapBandNonTransparentPixels = 0
    for (let y = 0; y < copy.height; y += 1) {
      for (
        let x = Math.max(0, gapX - gapHalfWidth);
        x <= Math.min(copy.width - 1, gapX + gapHalfWidth);
        x += 1
      ) {
        if (pixels[(y * copy.width + x) * 4 + 3]) gapBandNonTransparentPixels += 1
      }
    }
  }

  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(dataUrl))
  const sha256 = Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("")

  return {
    dataUrlBytes: dataUrl.length,
    sha256,
    width: copy.width,
    height: copy.height,
    nonTransparentPixels,
    gapBandNonTransparentPixels,
    gapBandWidth: gapHalfWidth * 2 + 1,
    drawStats: preview.ui.getDrawStats?.() || null,
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
    hasWebGL2: preview.chart.getAttribute("chartLibrary") === "webgl2",
    hasDygraph: Boolean(preview.chart.getUI().getDygraph?.()),
  }
}

const exerciseWebGL2ContextLossFallback = async () => {
  const runtime = prepared?.sdk ? getWebGL2Runtime(prepared.sdk) : null
  if (!preview || preview.chart.getAttribute("chartLibrary") !== "webgl2" || !runtime?.gl)
    throw new Error("A WebGL2 preview is required")
  const extension = runtime.gl.getExtension("WEBGL_lose_context")
  if (!extension) throw new Error("WEBGL_lose_context is unavailable")

  extension.loseContext()
  const deadline = performance.now() + 2000
  while (preview.chart.getAttribute("chartLibrary") === "webgl2" && performance.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  return {
    renderer: preview.chart.getAttribute("chartLibrary"),
    hasDygraph: Boolean(preview.chart.getUI().getDygraph?.()),
  }
}

const cleanup = async () => {
  preview?.destroy()
  preview = null
  if (prepared?.runtimeLease) prepared.runtime.release()
  if (prepared?.sdk) {
    disposeWebGPURuntime(prepared.sdk)
    disposeWebGL2Runtime(prepared.sdk)
  }
  prepared = null
  document.querySelectorAll("[data-benchmark-chart]").forEach(element => element.remove())
  setStatus("Renderer benchmark is idle")
  await forceGc()
}

window.__NETDATA_RENDERER_BENCHMARK__ = {
  prepare,
  measure,
  mountPreview,
  inspectPreview,
  capturePreview,
  exerciseDeviceLossFallback,
  exerciseWebGL2ContextLossFallback,
  getActiveWebGL2Contexts,
  cleanup,
}
