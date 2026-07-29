import makeAreaVisualization from "@/chartLibraries/gpu/visualizations/cartesian/area"
import makeLineVisualization from "@/chartLibraries/gpu/visualizations/cartesian/line"
import makeAreaResources from "./cartesian/area/resources"
import makeLineResources from "./cartesian/line/resources"

const visualizations = {
  area: options => makeAreaVisualization({ ...options, makeResources: makeAreaResources }),
  line: options => makeLineVisualization({ ...options, makeResources: makeLineResources }),
}

export const hasVisualization = visualization => visualization in visualizations

export const getVisualization = visualization => visualizations[visualization]
