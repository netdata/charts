import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import makePackedData from "./data"
import makeKernel from "./kernel"
import { makeSeriesColors } from "./colors"
import {
  getWebGPURuntime,
  isWebGPUSupported,
  markWebGPUFailed,
} from "./runtime"

const makeWebGPU = (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  const packedData = makePackedData(chart)
  let element = null
  let canvas = null
  let kernel = null
  let runtime = null
  let listeners = null
  let resizeObserver = null
  let offDeviceLost = null
  let leaseHeld = false
  let generation = 0
  let lastPacked = null
  let colors = null
  let colorsDirty = true
  let failureHandled = false
  let ready = Promise.resolve(false)

  const releaseRuntime = () => {
    if (!leaseHeld) return
    leaseHeld = false
    runtime?.release()
  }

  const fallback = error => {
    if (failureHandled) return false
    failureHandled = true
    markWebGPUFailed(sdk)
    const replaced = chart.fallbackChartLibrary?.("webgpu")
    sdk.trigger("rendererFallback", chart, "webgpu", error)
    chart.trigger("rendererFallback", "webgpu", error)
    return replaced
  }

  const getValueRange = () => {
    const getRange = chart.getAttribute("getValueRange")
    const range = typeof getRange === "function" ? getRange(chart) : null
    const min = range?.[0] ?? chart.getAttribute("min")
    const max = range?.[1] ?? chart.getAttribute("max")
    return [min, max]
  }

  const renderFrame = () => {
    if (!element || !kernel) return false

    const { highlighting, panning, processing } = chart.getAttributes()
    if (highlighting || panning || processing) return false

    const packed = packedData.get()
    if (!packed) {
      kernel.clear()
      chartUI.render()
      chartUI.trigger("rendered")
      return true
    }

    const dataChanged = packed !== lastPacked
    if (dataChanged) colorsDirty = true
    if (colorsDirty) colors = makeSeriesColors(chart)

    const [afterMs, beforeMs] = chart.getDateWindow()
    const [min, max] = getValueRange()
    kernel.update({
      packed,
      colors,
      dataChanged,
      colorsChanged: colorsDirty,
      afterMs,
      beforeMs,
      min,
      max,
      width: chartUI.getChartWidth(),
      height: chartUI.getChartHeight(),
      dpr: window.devicePixelRatio || 1,
      lineWidth: 1.5,
      stepped: chart.getAttribute("stepPlot"),
    })
    kernel.draw()
    lastPacked = packed
    colorsDirty = false
    chartUI.render()
    chartUI.trigger("rendered")
    return true
  }

  const render = () => {
    try {
      return renderFrame()
    } catch (error) {
      fallback(error)
      return false
    }
  }

  const initialize = currentGeneration => {
    runtime = getWebGPURuntime(sdk)
    ready = runtime
      .acquire()
      .then(async () => {
        leaseHeld = true
        if (currentGeneration !== generation || !canvas) {
          releaseRuntime()
          return false
        }

        offDeviceLost = runtime.onLost(info =>
          fallback(new Error(`WebGPU device lost: ${info.reason}: ${info.message}`))
        )
        const nextKernel = await makeKernel(runtime, canvas)
        if (currentGeneration !== generation || !canvas) {
          nextKernel.destroy()
          releaseRuntime()
          return false
        }

        kernel = nextKernel
        render()
        return true
      })
      .catch(error => {
        if (currentGeneration === generation && element) fallback(error)
        return false
      })
    return ready
  }

  const mount = node => {
    if (element) return

    generation += 1
    const currentGeneration = generation
    element = node
    chartUI.mount(node)
    canvas = document.createElement("canvas")
    canvas.dataset.renderer = "webgpu"
    canvas.style.display = "block"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    element.appendChild(canvas)

    const markColorsDirty = () => {
      colorsDirty = true
      render()
    }
    resizeObserver = makeResizeObserver(
      element,
      () => render(),
      () => render()
    )
    listeners = unregister(
      chart.on("visibleDimensionsChanged", markColorsDirty),
      chart.onAttributeChange("selectedLegendDimensions", markColorsDirty),
      chart.onAttributeChange("colors", markColorsDirty),
      chart.onAttributeChange("theme", markColorsDirty),
      chart.onAttributeChange("stepPlot", render),
      chart.onAttributeChange("staticValueRange", render),
      chart.onAttributeChange("valueRange", render)
    )

    initialize(currentGeneration)
  }

  const unmount = () => {
    generation += 1
    listeners?.()
    listeners = null
    resizeObserver?.()
    resizeObserver = null
    offDeviceLost?.()
    offDeviceLost = null
    kernel?.destroy()
    kernel = null
    canvas?.remove()
    canvas = null
    packedData.clear()
    lastPacked = null
    colors = null
    colorsDirty = true
    releaseRuntime()
    element = null
    chartUI.unmount()
  }

  const getPlotArea = () => ({
    left: 0,
    top: 0,
    width: chartUI.getChartWidth(),
    height: chartUI.getChartHeight(),
  })
  const getXAxisRange = () => chart.getDateWindow()
  const getXCoord = timestampMs => {
    const [after, before] = getXAxisRange()
    const width = chartUI.getChartWidth()
    return before === after ? 0 : ((timestampMs - after) / (before - after)) * width
  }

  return {
    ...chartUI,
    mount,
    unmount,
    render,
    getPlotArea,
    getXAxisRange,
    getXCoord,
    getCanvas: () => canvas,
    getQueueDone: () => kernel?.getQueueDone() || ready,
    getBufferBytes: () => kernel?.getBufferBytes() || 0,
    whenReady: () => ready,
  }
}

makeWebGPU.isSupported = isWebGPUSupported

export default makeWebGPU
