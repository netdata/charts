import makeLineVisualization from "../line"

export const makeAreaStyle = chart => {
  const sparkline = chart.isSparkline()
  return {
    fillAlpha: sparkline ? 1 : 0.2,
    lineWidth: sparkline ? 0 : 0.7,
    smooth: false,
    stepped: chart.getAttribute("stepPlot"),
  }
}

export default options =>
  makeLineVisualization({
    ...options,
    forceIncludeZero: true,
    makeSeriesStyle: makeAreaStyle,
  })
