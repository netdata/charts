import makeRenderer from "./engine/makeRenderer"
import { isWebGPUSupported } from "./engine/runtime"
import { getVisualization, hasVisualization } from "./visualizations"

const makeUnsupportedVisualization = visualization => () => ({
  mount: () => {},
  unmount: () => {},
  createGPU: () => Promise.reject(new Error(`Unsupported WebGPU visualization: ${visualization}`)),
  attachGPU: resource => resource.destroy?.(),
  render: () => false,
})

const makeWebGPU = (sdk, chart) => {
  const visualizationId =
    chart.getVisualizationType?.() || chart.getAttribute("chartType") || "line"
  const makeVisualization =
    getVisualization(visualizationId) || makeUnsupportedVisualization(visualizationId)

  return makeRenderer({ sdk, chart, makeVisualization, visualizationId })
}

makeWebGPU.isSupported = (sdk, visualization = "line") =>
  hasVisualization(visualization) && isWebGPUSupported(sdk)

export default makeWebGPU
