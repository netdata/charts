import { shortForLength } from "@/helpers/shorten"

export const getD3PieRowIndex = chart => {
  const { data } = chart.getPayload()
  const hoverX = chart.getAttribute("hoverX")
  const index = hoverX ? chart.getClosestRow(hoverX[0]) : -1
  return index === -1 ? data.length - 1 : index
}

export const groupD3PieContent = (content, color) => {
  const sorted = [...content].sort((a, b) =>
    a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1
  )
  const priorities = sorted
    .map((row, index) => ({ index, value: row.value }))
    .sort((a, b) => (a.value < b.value ? 1 : -1))
  priorities.forEach(({ index }, priority) => {
    sorted[index].smallSegmentPriority = priority
  })

  const visible = []
  const grouped = []
  let groupedValue = 0
  sorted.forEach(row => {
    if (row.smallSegmentPriority >= 5) {
      grouped.push(row)
      groupedValue += row.value
    } else {
      row.isGrouped = false
      visible.push(row)
    }
  })
  if (grouped.length) {
    visible.push({
      enabled: true,
      valueType: "count",
      label: `[smaller ${grouped.length}]`,
      caption: "rest of dimensions",
      color,
      value: groupedValue,
      isGrouped: true,
      groupedData: grouped,
    })
  }
  return visible
}

export const makeD3PieContent = (chart, chartUI) => {
  const index = getD3PieRowIndex(chart)
  const values = chart
    .getVisibleDimensionIds()
    .map(id => {
      const signedValue = chart.getDimensionValue(id, index, { abs: false })
      return {
        label: shortForLength(id, 30),
        value: Math.abs(signedValue),
        signedValue,
        color: chart.selectDimensionColor(id),
        caption: id,
        id,
      }
    })
    .filter(({ value }) => Boolean(value))

  return values.length
    ? values
    : [
        {
          label: "No data",
          value: 1,
          color: chartUI.chart.getThemeAttribute("themeD3pieSmallColor"),
        },
      ]
}
