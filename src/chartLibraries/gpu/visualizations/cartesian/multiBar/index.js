import makeLineVisualization from "../line"
import makeLineData, { makePointValueReader } from "../line/data"
import { getVisibleSeriesIndexes, makeMultiBarColors } from "./colors"

const lowerBound = (rows, target) => {
  let low = 0
  let high = rows.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (rows[middle][0] < target) low = middle + 1
    else high = middle
  }
  return low
}

const upperBound = (rows, target) => {
  let low = 0
  let high = rows.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (rows[middle][0] <= target) low = middle + 1
    else high = middle
  }
  return low - 1
}

export const getReducedWindowBounds = ({
  rows,
  point,
  seriesIndex,
  afterMs,
  beforeMs,
}) => {
  if (!rows.length) return null
  const low = Math.min(afterMs, beforeMs)
  const high = Math.max(afterMs, beforeMs)
  const readValue = makePointValueReader(point)
  let first = lowerBound(rows, low)
  let last = upperBound(rows, high)
  if (first >= rows.length) first = 0
  if (last < 0) last = rows.length - 1

  let seek = true
  while (seek && first > 0) {
    first -= 1
    seek = readValue(rows[first][seriesIndex + 1]) === null
  }
  seek = true
  while (seek && last < rows.length - 1) {
    last += 1
    seek = readValue(rows[last][seriesIndex + 1]) === null
  }

  return { first, last }
}

export const getMultiBarGroupWidth = ({
  packed,
  visibleSeriesIndexes,
  afterMs,
  beforeMs,
  plotWidth,
}) => {
  const domainWidth = beforeMs - afterMs
  if (!domainWidth) return 0
  let minimumSeparation = Infinity

  visibleSeriesIndexes.forEach(seriesIndex => {
    const bounds = getReducedWindowBounds({
      rows: packed.sourceRows,
      point: packed.point,
      seriesIndex,
      afterMs,
      beforeMs,
    })
    if (!bounds || bounds.first + 1 > bounds.last) return
    const separation =
      ((packed.sourceRows[bounds.first + 1][0] - packed.sourceRows[bounds.first][0]) /
        domainWidth) *
      plotWidth
    if (separation < minimumSeparation) minimumSeparation = separation
  })

  return Number.isFinite(minimumSeparation)
    ? Math.floor((2 / 3) * minimumSeparation)
    : 0
}

const makeMultiBarData = chart => makeLineData(chart, { trackGapEdges: false })

export const makeMultiBarStyle = (chart, { packed, frame }) => ({
  barWidth: getMultiBarGroupWidth({
    packed,
    visibleSeriesIndexes: getVisibleSeriesIndexes(chart),
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
    makeColors: makeMultiBarColors,
    makeMarkers: () => [],
    makePackedData: makeMultiBarData,
    makeSeriesStyle: makeMultiBarStyle,
  })
