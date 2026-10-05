export const sumRow = rowData => {
  const [, ...rows] = rowData
  return rows.reduce((acc, v = 0) => acc + v, 0)
}

export const toPercentage = (value, min, max) => ((value - min) / (max - min)) * 100

export const isModernFlavour = chart => chart.getAttribute("designFlavour") === "modern"

export const getRingValue = chart => {
  const { hoverX, loaded } = chart.getAttributes()
  if (!loaded) return null

  const { data } = chart.getPayload()
  if (data?.length === undefined) return null

  const row = hoverX ? chart.getClosestRow(hoverX[0]) : data.length - 1
  const rowData = data[row]
  if (!Array.isArray(rowData)) return null

  const value = sumRow(rowData)
  const [min, max] = chart.getAttribute("getValueRange")(chart)

  return { value, min, max, percentage: toPercentage(value, min, max) }
}
