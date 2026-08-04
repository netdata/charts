import makeLineVisualization from "../line"
import makeStackedData, { getVisibleStackedRange } from "./data"
import { findClosestStackedDimension } from "./interaction"

export const makeStackedStyle = chart => {
  const sparkline = chart.isSparkline()
  return {
    fillAlpha: sparkline ? 1 : 0.8,
    lineWidth: sparkline ? 0 : 0.1,
    smooth: false,
    stepped: chart.getAttribute("stepPlot"),
  }
}

export default options =>
  makeLineVisualization({
    ...options,
    findDimension: findClosestStackedDimension,
    forceIncludeZero: true,
    getPackedVisibleRange: getVisibleStackedRange,
    makePackedData: makeStackedData,
    makeSeriesStyle: makeStackedStyle,
  })
