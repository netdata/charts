import makeLineVisualization from "./cartesian/line"

const visualizations = {
  line: makeLineVisualization,
}

export const hasVisualization = visualization => visualization in visualizations

export const getVisualization = visualization => visualizations[visualization]
