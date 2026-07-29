import makeChartUI from "@/sdk/makeChartUI"
import makeGPUResizeObserver from "@/chartLibraries/gpu/resize"
import { isUnsupportedVisualizationConfiguration } from "@/chartLibraries/gpu/errors"
import { getWebGPURuntime, markWebGPUFailed } from "./runtime"

const makeCanvas = element => {
  const canvas = document.createElement("canvas")
  canvas.dataset.renderer = "webgpu"
  canvas.style.display = "block"
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  canvas.style.touchAction = "none"
  element.appendChild(canvas)
  return canvas
}

export default ({ sdk, chart, makeVisualization, visualizationId }) => {
  const chartUI = makeChartUI(sdk, chart)
  const visualization = makeVisualization({ sdk, chart, chartUI })
  let element = null
  let canvas = null
  let runtime = null
  let resizeObserver = null
  let offDeviceLost = null
  let leaseHeld = false
  let generation = 0
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
    if (!isUnsupportedVisualizationConfiguration(error)) markWebGPUFailed(sdk)
    const replaced = chart.fallbackChartLibrary?.("webgpu", "webgl2")
    sdk.trigger("rendererFallback", chart, "webgpu", error)
    chart.trigger("rendererFallback", "webgpu", error)
    return replaced
  }

  const renderFrame = () => {
    if (!element || !canvas) return false

    const rendered = visualization.render({
      width: chartUI.getChartWidth(),
      height: chartUI.getChartHeight(),
      dpr: window.devicePixelRatio || 1,
    })
    if (!rendered) return false

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
        const resource = await visualization.createResources(runtime, canvas)
        if (currentGeneration !== generation || !canvas) {
          resource.destroy?.()
          releaseRuntime()
          return false
        }

        try {
          visualization.attachResources(resource)
        } catch (error) {
          resource.destroy?.()
          throw error
        }
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
    failureHandled = false
    element = node
    chartUI.mount(node)
    canvas = makeCanvas(element)
    visualization.mount({ render, canvas })
    resizeObserver = makeGPUResizeObserver(element, render)
    initialize(currentGeneration)
  }

  const unmount = () => {
    generation += 1
    resizeObserver?.()
    resizeObserver = null
    offDeviceLost?.()
    offDeviceLost = null
    visualization.unmount()
    canvas?.remove()
    canvas = null
    releaseRuntime()
    element = null
    chartUI.unmount()
  }

  return {
    ...chartUI,
    mount,
    unmount,
    render,
    getPlotArea: (...args) => visualization.getPlotArea?.(...args),
    getXAxisRange: (...args) => visualization.getXAxisRange?.(...args),
    getXCoord: (...args) => visualization.getXCoord?.(...args),
    getCanvas: () => canvas,
    getQueueDone: () => visualization.getQueueDone?.() || ready,
    getBufferBytes: () => visualization.getBufferBytes?.() || 0,
    getDrawStats: () => visualization.getDrawStats?.() || null,
    getVisualizationId: () => visualizationId,
    whenReady: () => ready,
  }
}
