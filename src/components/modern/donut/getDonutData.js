export const otherId = "__other__"

const getRowIndex = chart => {
  const { data } = chart.getPayload()
  const hoverX = chart.getAttribute("hoverX")
  const index = hoverX ? chart.getClosestRow(hoverX[0]) : -1
  return index === -1 ? data.length - 1 : index
}

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

  const byLabel = (a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1)
  const shown = (values.length > limit ? values.slice(0, limit) : values).sort(byLabel)
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
