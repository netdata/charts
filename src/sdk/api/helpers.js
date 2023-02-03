export const getChartURLOptions = chart => {
  const {
    chartUrlOptions,
    composite,
    eliminateZeroDimensions,
    groupBy,
    urlOptions,
    postAggregationMethod,
  } = chart.getAttributes()
  const isSumOfAbs =
    composite && (groupBy !== "dimension" || postAggregationMethod === "sum-of-abs")

  return [
    ...(chartUrlOptions || chart.getUI().getUrlOptions()),
    ...urlOptions,
    "jsonwrap",
    eliminateZeroDimensions && "nonzero",
    "flip",
    "ms",
    isSumOfAbs && "abs",
  ].filter(Boolean)
}

export const getChartPayload = chart => {
  const ui = chart.getUI()

  const { format } = ui
  const width = ui.getParentWidth() || ui.getEstimatedChartWidth() || ui.getChartWidth()

  const pixelsPerPoint = ui.getPixelsPerPoint()
  const { after, before, groupingMethod, groupingTime } = chart.getAttributes()

  const dataPadding = Math.round((before - after) / 2)
  const afterWithPadding = after - dataPadding
  const beforeWithPadding = before + dataPadding
  const pointsMultiplier = after < 0 ? 1.5 : 2

  return {
    points: Math.round((width / pixelsPerPoint) * pointsMultiplier),
    format,
    group: groupingMethod,
    gtime: groupingTime,
    after: afterWithPadding,
    ...(after > 0 && { before: beforeWithPadding }),
    with_metadata: true,
  }
}

export const errorCodesToMessage = {
  ErrAllNodesFailed: "All agents failed to return data",
}
