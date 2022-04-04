export const getChartURLOptions = chart => {
  const {
    chartUrlOptions,
    composite,
    eliminateZeroDimensions,
    groupBy,
    urlOptions,
  } = chart.getAttributes()
  const isSumOfAbs = composite && groupBy !== "dimension"

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

  return {
    points: Math.round(width / pixelsPerPoint),
    format,
    group: groupingMethod,
    gtime: groupingTime,
    after,
    ...(after > 0 && { before }),
  }
}
