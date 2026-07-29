import makeAreaVisualization from "@/chartLibraries/gpu/visualizations/cartesian/area"
import makeHeatmapVisualization from "@/chartLibraries/gpu/visualizations/cartesian/heatmap"
import makeLineVisualization from "@/chartLibraries/gpu/visualizations/cartesian/line"
import makeMultiBarVisualization from "@/chartLibraries/gpu/visualizations/cartesian/multiBar"
import makeStackedVisualization from "@/chartLibraries/gpu/visualizations/cartesian/stacked"
import makeStackedBarVisualization from "@/chartLibraries/gpu/visualizations/cartesian/stackedBar"
import makeEasyPieVisualization from "@/chartLibraries/gpu/visualizations/radial/easyPie"
import makeAreaResources from "./cartesian/area/resources"
import makeHeatmapResources from "./cartesian/heatmap/resources"
import makeLineResources from "./cartesian/line/resources"
import makeMultiBarResources from "./cartesian/multiBar/resources"
import makeStackedResources from "./cartesian/stacked/resources"
import makeStackedBarResources from "./cartesian/stackedBar/resources"
import makeEasyPieResources from "./radial/easyPie/resources"

const visualizations = {
  area: options => makeAreaVisualization({ ...options, makeResources: makeAreaResources }),
  easypiechart: options =>
    makeEasyPieVisualization({ ...options, makeResources: makeEasyPieResources }),
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
