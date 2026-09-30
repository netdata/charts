export const otherId = "__other__"

// Same row as the d3pie library: the hovered timestamp, or the latest point.
const getRowIndex = chart => {
  const { data } = chart.getPayload()
  const hoverX = chart.getAttribute("hoverX")
  const index = hoverX ? chart.getClosestRow(hoverX[0]) : -1
  return index === -1 ? data.length - 1 : index
}

export const formatWithUnit = (chart, value, dimensionId) => {
  const options = dimensionId ? { dimensionId } : {}
  const unitAttributes = chart.getUnitAttributesForValue(value, options)
  return {
    value: chart.getConvertedValue(value, { ...options, unitAttributes }),
    unit: chart.getUnitSign({ ...options, unitAttributes }),
  }
}

// Mirrors the d3pie smallSegmentGrouping (top 5 by value, the rest grouped) so the modern donut
// keeps the same slices; ordered by value because the donut reads as a ranking.
export default (chart, { limit = 5 } = {}) => {
  const { data } = chart.getPayload()
  if (!data?.length) return { slices: [], total: 0 }

  const index = getRowIndex(chart)

  const values = chart
    .getVisibleDimensionIds()
    .map(id => {
      const signedValue = chart.getDimensionValue(id, index, { abs: false })
      return {
        id,
        name: chart.getDimensionName(id) || id,
        value: Math.abs(signedValue),
        signedValue,
        color: chart.selectDimensionColor(id),
      }
    })
    .filter(slice => !!slice.value)
    .sort((a, b) => b.value - a.value)

  const total = values.reduce((sum, slice) => sum + slice.value, 0)
  if (!total) return { slices: [], total: 0 }

  const shown = values.length > limit ? values.slice(0, limit) : values
  const rest = values.length > limit ? values.slice(limit) : []

  const slices = rest.length
    ? [
        ...shown,
        {
          id: otherId,
          name: `${rest.length} more`,
          value: rest.reduce((sum, slice) => sum + slice.value, 0),
          color: chart.getThemeAttribute("themeD3pieSmallColor"),
          grouped: rest.map(slice => slice.id),
        },
      ]
    : shown

  return {
    slices: slices.map(slice => ({ ...slice, share: (slice.value / total) * 100 })),
    total,
  }
}
