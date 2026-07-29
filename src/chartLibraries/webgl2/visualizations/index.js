import makeAreaVisualization from "@/chartLibraries/gpu/visualizations/cartesian/area"
import makeHeatmapVisualization from "@/chartLibraries/gpu/visualizations/cartesian/heatmap"
import makeLineVisualization from "@/chartLibraries/gpu/visualizations/cartesian/line"
import makeMultiBarVisualization from "@/chartLibraries/gpu/visualizations/cartesian/multiBar"
import makeStackedVisualization from "@/chartLibraries/gpu/visualizations/cartesian/stacked"
import makeStackedBarVisualization from "@/chartLibraries/gpu/visualizations/cartesian/stackedBar"
import makeD3PieVisualization from "@/chartLibraries/gpu/visualizations/radial/d3Pie"
import makeEasyPieVisualization from "@/chartLibraries/gpu/visualizations/radial/easyPie"
import makeGaugeVisualization from "@/chartLibraries/gpu/visualizations/radial/gauge"
import makeAreaResources from "./cartesian/area/resources"
import makeHeatmapResources from "./cartesian/heatmap/resources"
import makeLineResources from "./cartesian/line/resources"
import makeMultiBarResources from "./cartesian/multiBar/resources"
import makeStackedResources from "./cartesian/stacked/resources"
import makeStackedBarResources from "./cartesian/stackedBar/resources"
import makeD3PieResources from "./radial/d3Pie/resources"
import makeEasyPieResources from "./radial/easyPie/resources"
import makeGaugeResources from "./radial/gauge/resources"

const visualizations = {
  d3pie: options => makeD3PieVisualization({ ...options, makeResources: makeD3PieResources }),
  area: options => makeAreaVisualization({ ...options, makeResources: makeAreaResources }),
  easypiechart: options =>
    makeEasyPieVisualization({ ...options, makeResources: makeEasyPieResources }),
  gauge: options => makeGaugeVisualization({ ...options, makeResources: makeGaugeResources }),
  heatmap: options => makeHeatmapVisualization({ ...options, makeResources: makeHeatmapResources }),
  line: options => makeLineVisualization({ ...options, makeResources: makeLineResources }),
  multiBar: options =>
    makeMultiBarVisualization({ ...options, makeResources: makeMultiBarResources }),
  stacked: options =>
    makeStackedVisualization({ ...options, makeResources: makeStackedResources }),
  stackedBar: options =>
    makeStackedBarVisualization({ ...options, makeResources: makeStackedBarResources }),
}

export const hasVisualization = visualization => visualization in visualizations
export const getVisualization = visualization => visualizations[visualization]
