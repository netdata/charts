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

  const width = ui.getChartWidth()
  const pixelsPerPoint = ui.getPixelsPerPoint()
  const { after, before, groupingMethod, groupingTime } = chart.getAttributes()

  return {
    points: Math.round(width / pixelsPerPoint),
    group: groupingMethod,
    gtime: groupingTime,
    after,
    ...(after > 0 && { before }),
  }
}
