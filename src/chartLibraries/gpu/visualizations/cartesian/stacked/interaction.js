import { valueToY } from "../line/interactions"
import { makeDivergingStackedBounds } from "./data"

export const findClosestStackedDimension = ({ chart, row, y, domain, plot }) => {
  const dimensionIds = chart.getPayloadDimensionIds()
  const selected = chart.getAttribute("selectedLegendDimensions") || []
  const visibleSeries = new Uint8Array(dimensionIds.length)
  dimensionIds.forEach((id, index) => {
    if (!selected.length || chart.isDimensionVisible(id)) visibleSeries[index] = 1
  })
  const payload = chart.getPayload()
  const boundsBySeries = makeDivergingStackedBounds(
    payload.data[row],
    dimensionIds.length,
    payload.point,
    visibleSeries
  )
  let dimensionId = null
  let closestDistance = Infinity

  boundsBySeries.forEach((bounds, index) => {
    if (!bounds) return
    const baseY = valueToY(bounds.base, domain, plot)
    const endY = valueToY(bounds.end, domain, plot)
    const top = Math.min(baseY, endY)
    const bottom = Math.max(baseY, endY)
    const distance = y < top ? top - y : y > bottom ? y - bottom : 0
    if (distance >= closestDistance) return
    closestDistance = distance
    dimensionId = dimensionIds[index]
  })

  return dimensionId
}
