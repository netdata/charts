import { darkenColor } from "@/chartLibraries/dygraph/plotters/helpers"
import { parseColor } from "../line/colors"

export const getVisibleSeriesIndexes = chart => {
  const selected = chart.getAttribute("selectedLegendDimensions") || []
  return chart.getPayloadDimensionIds().reduce((indexes, id, index) => {
    if (!selected.length || chart.isDimensionVisible(id)) indexes.push(index)
    return indexes
  }, [])
}

export const makeMultiBarColors = chart => {
  const dimensionIds = chart.getPayloadDimensionIds()
  const visibleIndexes = getVisibleSeriesIndexes(chart)
  const visibleRanks = new Map(visibleIndexes.map((index, rank) => [index, rank]))
  const colors = new Float32Array(dimensionIds.length * 12)

  dimensionIds.forEach((id, index) => {
    const source = chart.selectDimensionColor(id)
    const fill = parseColor(source)
    const stroke = parseColor(darkenColor(source))
    const rank = visibleRanks.get(index)
    if (rank === undefined) {
      fill[3] = 0
      stroke[3] = 0
    }
    colors.set(fill, index * 12)
    colors.set(stroke, index * 12 + 4)
    colors.set([rank ?? -1, visibleIndexes.length, 0, 0], index * 12 + 8)
  })

  return colors
}
