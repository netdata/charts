import makeAreaVisualization from "./cartesian/area"
import makeHeatmapVisualization from "./cartesian/heatmap"
import makeLineVisualization from "./cartesian/line"
import makeMultiBarVisualization from "./cartesian/multiBar"
import makeStackedVisualization from "./cartesian/stacked"
import makeStackedBarVisualization from "./cartesian/stackedBar"
import makeD3PieVisualization from "./radial/d3Pie"
import makeEasyPieVisualization from "./radial/easyPie"
import makeGaugeVisualization from "./radial/gauge"

const models = {
  area: makeAreaVisualization,
  d3pie: makeD3PieVisualization,
  easypiechart: makeEasyPieVisualization,
  gauge: makeGaugeVisualization,
  heatmap: makeHeatmapVisualization,
  line: makeLineVisualization,
  multiBar: makeMultiBarVisualization,
  stacked: makeStackedVisualization,
  stackedBar: makeStackedBarVisualization,
}

export default resources => {
  const visualizations = Object.fromEntries(
    Object.entries(resources).map(([id, makeResources]) => {
      const makeVisualization = models[id]
      if (!makeVisualization)
        throw new Error(`Unknown GPU visualization model: ${id}`)
      return [
        id,
        options => makeVisualization({ ...options, makeResources }),
      ]
    })
  )

  return {
    get: visualization => visualizations[visualization],
    has: visualization => visualization in visualizations,
  }
}
