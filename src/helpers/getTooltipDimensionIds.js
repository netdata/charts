import { isHeatmap } from "@/helpers/heatmap"

const isEmpty = value => value == null || value === 0

export default (chart, index, sort) => {
  let ids = chart.onHoverSortDimensions(index, sort) || []

  if (chart.getAttribute("selectedDimensions").length > 0)
    ids = ids.filter(id => chart.isDimensionVisible(id))

  if (!isHeatmap(chart)) return ids

  if (chart.getAttribute("heatmapTooltipHideZeros"))
    ids = ids.filter(id => !isEmpty(chart.getDimensionValue(id, index, { allowNull: true })))

  return chart.getAttribute("heatmapTooltipTopFirst") ? [...ids].reverse() : ids
}
