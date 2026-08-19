import makeLineVisualization from "../line"
import makeStackedData, { getVisibleStackedRange } from "../stacked/data"
import { findClosestStackedDimension } from "../stacked/interaction"
import { makeStackedBarColors } from "./colors"

const makeStackedBarData = chart => makeStackedData(chart, { trackGapEdges: false })

export const getStackedBarWidth = ({ packed, afterMs, beforeMs, plotWidth }) => {
  const domainWidth = beforeMs - afterMs
  const separation =
    Number.isFinite(packed.minXSeparationMs) && domainWidth
      ? (packed.minXSeparationMs / domainWidth) * plotWidth
      : plotWidth / Math.max(packed.pointCount, 1)

  return Math.max(1, Math.floor((2 / 3) * separation))
}

export const makeStackedBarStyle = (chart, { packed, frame }) => ({
  barWidth: getStackedBarWidth({
    packed,
    afterMs: frame.afterMs,
    beforeMs: frame.beforeMs,
    plotWidth: frame.plot.width,
  }),
  fillAlpha: 1,
  lineWidth: chart.isSparkline() ? 0 : 0.7,
  smooth: false,
  stepped: false,
})

export default options =>
  makeLineVisualization({
    ...options,
    findDimension: findClosestStackedDimension,
    forceIncludeZero: true,
    getPackedVisibleRange: getVisibleStackedRange,
    makeColors: makeStackedBarColors,
    makeMarkers: () => [],
    makePackedData: makeStackedBarData,
    makeSeriesStyle: makeStackedBarStyle,
  })
