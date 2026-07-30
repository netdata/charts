import makeRegistry from "@/chartLibraries/gpu/visualizations/makeRegistry"
import area from "./cartesian/area/resources"
import heatmap from "./cartesian/heatmap/resources"
import line from "./cartesian/line/resources"
import multiBar from "./cartesian/multiBar/resources"
import stacked from "./cartesian/stacked/resources"
import stackedBar from "./cartesian/stackedBar/resources"
import d3pie from "./radial/d3Pie/resources"
import easypiechart from "./radial/easyPie/resources"
import gauge from "./radial/gauge/resources"

const registry = makeRegistry({
  area,
  d3pie,
  easypiechart,
  gauge,
  heatmap,
  line,
  multiBar,
  stacked,
  stackedBar,
})

export const hasVisualization = registry.has
export const getVisualization = registry.get
