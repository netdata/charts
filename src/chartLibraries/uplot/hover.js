import { getStackBounds } from "./stacking"
import { stack } from "./bars/stack"

const anomalyBand = 15
const annotationBand = 10

const bandDistance = (top, aY, bY) => {
  const hi = Math.min(aY, bY)
  const lo = Math.max(aY, bY)
  return top < hi ? hi - top : top > lo ? top - lo : 0
}

const getNearestSeries = (chart, self, top, idx) => {
  const dimensionIds = chart.getPayloadDimensionIds()

  let closestId
  let closestDistance = Infinity

  dimensionIds.forEach((id, index) => {
    if (!chart.isDimensionVisible(id)) return

    const value = self.data[index + 1]?.[idx]
    if (value == null) return

    const y = self.valToPos(value, "y")
    if (!Number.isFinite(y)) return

    const distance = Math.abs(y - top)
    if (distance < closestDistance) {
      closestDistance = distance
      closestId = id
    }
  })

  return closestId ?? chart.getVisibleDimensionIds()?.[0]
}

const getNearestStackedSeries = (chart, self, top, idx) => {
  const dimensionIds = chart.getPayloadDimensionIds()
  const bounds = getStackBounds(chart.getPayload().data, dimensionIds, id =>
    chart.isDimensionVisible(id)
  )

  let closestId
  let closestDistance = Infinity

  dimensionIds.forEach((id, index) => {
    const bound = bounds[index]?.[idx]
    if (!bound) return

    const distance = bandDistance(top, self.valToPos(bound[0], "y"), self.valToPos(bound[1], "y"))
    if (distance < closestDistance) {
      closestDistance = distance
      closestId = id
    }
  })

  return closestId ?? chart.getVisibleDimensionIds()?.[0]
}

const getNearestStackedBarSeries = (chart, self, top, idx) => {
  const dimensionIds = chart.getPayloadDimensionIds()
  const omit = index => !chart.isDimensionVisible(dimensionIds[index - 1])
  const { data } = stack(self.data, omit)

  let closestId
  let closestDistance = Infinity

  dimensionIds.forEach((id, index) => {
    const seriesIndex = index + 1
    if (omit(seriesIndex)) return

    const end = data[seriesIndex]?.[idx]
    const value = self.data[seriesIndex]?.[idx]
    if (end == null || value == null) return

    const distance = bandDistance(
      top,
      self.valToPos(end - value, "y"),
      self.valToPos(end, "y")
    )
    if (distance < closestDistance) {
      closestDistance = distance
      closestId = id
    }
  })

  return closestId ?? chart.getVisibleDimensionIds()?.[0]
}

const getNearestHeatmapBucket = (chart, self, top) => {
  const ids = chart.getVisibleHeatmapIds?.()
  if (!ids?.length) return undefined

  let closestId
  let closestDistance = Infinity

  ids.forEach(id => {
    const yIndex = chart.getHeatmapYIndex(id)
    if (yIndex === -1) return

    const y = self.valToPos(yIndex, "y")
    if (!Number.isFinite(y)) return

    const distance = Math.abs(y - top)
    if (distance < closestDistance) {
      closestDistance = distance
      closestId = id
    }
  })

  return closestId
}

export default chart => self => {
  const { top, idx } = self.cursor
  if (idx == null) return chart.getVisibleDimensionIds()?.[0]

  if (top != null) {
    if (chart.getAttribute("showAnnotations") && top > self.over.clientHeight - annotationBand)
      return "ANNOTATIONS"
    if (chart.getAttribute("showAnomalies") && top < anomalyBand) return "ANOMALY_RATE"
  }

  const chartType = chart.getAttribute("chartType")

  if (chartType === "heatmap") return getNearestHeatmapBucket(chart, self, top)
  if (chartType === "stacked") return getNearestStackedSeries(chart, self, top, idx)
  if (chartType === "stackedBar") return getNearestStackedBarSeries(chart, self, top, idx)

  return getNearestSeries(chart, self, top, idx)
}
