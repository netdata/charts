import makeLineVisualization from "@/chartLibraries/gpu/visualizations/cartesian/line"
import makeLineResources from "./cartesian/line/resources"

const visualizations = {
  line: options => makeLineVisualization({ ...options, makeResources: makeLineResources }),
}

export const hasVisualization = visualization => visualization in visualizations
export const getVisualization = visualization => visualizations[visualization]
