import makeRenderer from "./engine/makeRenderer"
import { getWebGPUDiagnostics, isWebGPUSupported } from "./engine/runtime"
import { isGaugeConfigurationSupported } from "@/chartLibraries/gpu/visualizations/radial/gauge"
import { getVisualization, hasVisualization } from "./visualizations"

const makeUnsupportedVisualization = visualization => () => ({
  mount: () => {},
  unmount: () => {},
  createResources: () =>
    Promise.reject(new Error(`Unsupported WebGPU visualization: ${visualization}`)),
  attachResources: resource => resource.destroy?.(),
  render: () => false,
})

const makeWebGPU = (sdk, chart) => {
  const visualizationId =
    chart.getVisualizationType?.() || chart.getAttribute("chartType") || "line"
  const makeVisualization =
    getVisualization(visualizationId) || makeUnsupportedVisualization(visualizationId)

  return makeRenderer({ sdk, chart, makeVisualization, visualizationId })
}

makeWebGPU.isSupported = (sdk, visualization = "line", chart) =>
  hasVisualization(visualization) &&
  (visualization !== "gauge" || isGaugeConfigurationSupported(chart)) &&
  isWebGPUSupported(sdk)
makeWebGPU.fallbackRenderer = "webgl2"
makeWebGPU.getDiagnostics = getWebGPUDiagnostics

export default makeWebGPU
