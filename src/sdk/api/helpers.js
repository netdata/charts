export const getChartURLOptions = chart => {
  const { chartUrlOptions, urlOptions, eliminateZeroDimensions } = chart.getAttributes()

  return [
    ...(chartUrlOptions || chart.getUI().getUrlOptions()),
    ...urlOptions,
    "jsonwrap",
    eliminateZeroDimensions && "nonzero",
    "flip",
    "ms",
  ].filter(Boolean)
}

export const getChartPayload = chart => {
  const ui = chart.getUI()

  const { format } = ui
  const width = ui.getChartWidth()
  const pixelsPerPoint = ui.getPixelsPerPoint()
  const { after, before, groupingMethod, groupingTime, groupingDimensions } = chart.getAttributes()

  return {
    points: Math.round(width / pixelsPerPoint),
    format,
    group: groupingMethod,
    gtime: groupingTime,
    after,
    ...(after > 0 && { before }),
    dimensions: groupingDimensions,
  }
}
