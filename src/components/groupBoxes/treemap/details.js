const stat = (sts, key, index) => {
  const values = sts?.[key]
  return Array.isArray(values) && typeof values[index] === "number" ? values[index] : null
}

export const getBoxDetails = (chart, id, rowData) => {
  const viewDimensions = chart.getAttribute("viewDimensions") || {}
  const index = chart.getDimensionIndex(id)
  const { all } = chart.getPayload()

  return {
    value: chart.getRowDimensionValue(id, rowData, { abs: false }),
    series: all.map((_, row) => chart.getDimensionValue(id, row) ?? 0),
    min: stat(viewDimensions.sts, "min", index),
    avg: stat(viewDimensions.sts, "avg", index),
    max: stat(viewDimensions.sts, "max", index),
    anomalyRate: stat(viewDimensions.sts, "arp", index),
    contribution: stat(viewDimensions.sts, "con", index),
    labels: Object.entries(viewDimensions.labels || {}).map(([key, values]) => ({
      key,
      values: Array.isArray(values?.[index]) ? values[index] : [],
    })),
  }
}

export const getRank = (siblingIds, id, valueOf) => {
  const sorted = [...siblingIds].sort(
    (a, b) => (valueOf(b) ?? -Infinity) - (valueOf(a) ?? -Infinity)
  )
  return { rank: sorted.indexOf(id) + 1, of: siblingIds.length }
}
