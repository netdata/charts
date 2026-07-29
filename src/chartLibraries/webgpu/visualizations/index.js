import makeAreaVisualization from "@/chartLibraries/gpu/visualizations/cartesian/area"
import makeLineVisualization from "@/chartLibraries/gpu/visualizations/cartesian/line"
import makeStackedVisualization from "@/chartLibraries/gpu/visualizations/cartesian/stacked"
import makeAreaResources from "./cartesian/area/resources"
import makeLineResources from "./cartesian/line/resources"
import makeStackedResources from "./cartesian/stacked/resources"

const visualizations = {
  area: options => makeAreaVisualization({ ...options, makeResources: makeAreaResources }),
  line: options => makeLineVisualization({ ...options, makeResources: makeLineResources }),
  stacked: options =>
    makeStackedVisualization({ ...options, makeResources: makeStackedResources }),
}

export const hasVisualization = visualization => visualization in visualizations

export const getVisualization = visualization => visualizations[visualization]
