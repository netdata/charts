import makeRenderer from "./engine/makeRenderer"
import { isWebGL2Supported } from "./engine/runtime"
import { isGaugeConfigurationSupported } from "@/chartLibraries/gpu/visualizations/radial/gauge"
import { getVisualization, hasVisualization } from "./visualizations"

const makeUnsupportedVisualization = visualization => () => ({
  mount: () => {},
  unmount: () => {},
  createResources: () =>
    Promise.reject(new Error(`Unsupported WebGL2 visualization: ${visualization}`)),
  attachResources: resource => resource.destroy?.(),
  render: () => false,
})

const makeWebGL2 = (sdk, chart) => {
  const visualizationId =
    chart.getVisualizationType?.() || chart.getAttribute("chartType") || "line"
  const makeVisualization =
    getVisualization(visualizationId) || makeUnsupportedVisualization(visualizationId)
  return makeRenderer({ sdk, chart, makeVisualization, visualizationId })
}

makeWebGL2.isSupported = (sdk, visualization = "line", chart) =>
  hasVisualization(visualization) &&
  (visualization !== "gauge" || isGaugeConfigurationSupported(chart)) &&
  isWebGL2Supported(sdk)

export default makeWebGL2
