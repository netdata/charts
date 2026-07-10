import DefaultHandler from "dygraphs/src/datahandler/default"

const stackBaseKey = "netdataStackBase"
const stackEndKey = "netdataStackEnd"

export const getDivergingStackBounds = point => {
  const base = point?.[stackBaseKey]
  const end = point?.[stackEndKey]

  return Number.isFinite(base) && Number.isFinite(end) ? { base, end } : null
}

export const findDivergingStackedPoint = (points, offsetY, toDomYCoord) => {
  let closestPoint
  let closestDistance = Infinity

  points.forEach(point => {
    const bounds = getDivergingStackBounds(point)
    if (!bounds) return

    const baseY = toDomYCoord(bounds.base)
    const endY = toDomYCoord(bounds.end)
    if (!Number.isFinite(baseY) || !Number.isFinite(endY)) return

    const top = Math.min(baseY, endY)
    const bottom = Math.max(baseY, endY)
    const distance = offsetY < top ? top - offsetY : offsetY > bottom ? offsetY - bottom : 0

    if (distance >= closestDistance) return

    closestPoint = point
    closestDistance = distance
  })

  if (!closestPoint) return {}

  return {
    point: closestPoint,
    row: closestPoint.idx,
    seriesName: closestPoint.name,
  }
}

export const makeDivergingStackedDataHandler = chart => {
  return class DivergingStackedDataHandler extends DefaultHandler {
    constructor() {
      super()

      const dimensionIds = chart.getPayloadDimensionIds()
      const selectedDimensions = chart.getAttribute("selectedLegendDimensions")
      const visibleDimensionIds = selectedDimensions?.length
        ? dimensionIds.filter(chart.isDimensionVisible)
        : dimensionIds

      this.dimensionIds = new Set(dimensionIds)
      this.firstStackedSeries = visibleDimensionIds[visibleDimensionIds.length - 1]
      this.positiveStack = []
      this.negativeStack = []
      this.pendingExtremes = null
    }

    getExtremeYValues(series, dateWindow, stepPlot) {
      this.pendingExtremes = super.getExtremeYValues(series, dateWindow, stepPlot)
      return this.pendingExtremes
    }

    seriesToPoints(series, setName, boundaryIdStart) {
      const points = super.seriesToPoints(series, setName, boundaryIdStart)
      if (!this.dimensionIds.has(setName)) return points

      if (setName === this.firstStackedSeries) {
        this.positiveStack = []
        this.negativeStack = []
      }

      let min = null
      let max = null

      points.forEach(point => {
        const value = point.yval
        if (!Number.isFinite(value)) {
          point[stackBaseKey] = null
          point[stackEndKey] = null
          return
        }

        const stack = value < 0 ? this.negativeStack : this.positiveStack
        const base = stack[point.idx] ?? 0
        const end = base + value

        stack[point.idx] = end
        point[stackBaseKey] = base
        point[stackEndKey] = end

        if (min === null || end < min) min = end
        if (max === null || end > max) max = end
      })

      if (this.pendingExtremes) {
        this.pendingExtremes[0] = min
        this.pendingExtremes[1] = max
      }

      return points
    }
  }
}
