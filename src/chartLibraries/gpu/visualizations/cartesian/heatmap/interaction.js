import { valueToY } from "../line/interactions"

export const findClosestHeatmapDimension = ({ chart, y, domain, plot }) => {
  const ids = chart.getVisibleHeatmapIds()
  let closestId = null
  let closestDistance = Infinity

  ids.forEach((id, index) => {
    const distance = Math.abs(valueToY(index, domain, plot) - y)
    if (distance >= closestDistance) return
    closestId = id
    closestDistance = distance
  })

  return closestId
}
