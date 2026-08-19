import { getVisibleSeriesIndexes } from "../multiBar/colors"
import { getFirstReducedSeparation } from "../multiBar"
import makeLineVisualization from "../line"
import { makeHeatmapAxes } from "./axes"
import { makeHeatmapMetadata } from "./colors"
import makeHeatmapData from "./data"
import { findClosestHeatmapDimension } from "./interaction"

export const getHeatmapValueRange = ({ chart }) =>
  chart.getAttribute("staticValueRange") || [0, chart.getVisibleHeatmapIds().length]

export const getHeatmapNotificationRange = ({ chart }) => [
  chart.getAttribute("min"),
  chart.getAttribute("max"),
]

export const makeHeatmapStyle = (chart, { packed, frame }) => {
  const separation = getFirstReducedSeparation({
    packed,
    visibleSeriesIndexes: getVisibleSeriesIndexes(chart),
    afterMs: frame.afterMs,
    beforeMs: frame.beforeMs,
    plotWidth: frame.plot.width,
  })

  return {
    barWidth: separation === null ? 0 : Math.floor(separation),
    fillAlpha: 1,
    heatmapMax: Number(chart.getAttribute("max")),
    lineWidth: 0,
    smooth: false,
    stepped: false,
  }
}

export default options =>
  makeLineVisualization({
    ...options,
    findDimension: findClosestHeatmapDimension,
    getAxisDimensionIds: chart => chart.getVisibleHeatmapIds(),
    getValueRangeOverride: getHeatmapValueRange,
    getYAxisNotificationRange: getHeatmapNotificationRange,
    makeAxes: makeHeatmapAxes,
    makeColors: makeHeatmapMetadata,
    makeMarkers: () => [],
    makePackedData: makeHeatmapData,
    makeSeriesStyle: makeHeatmapStyle,
  })
