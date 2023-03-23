export const getChartURLOptions = chart => {
  const { chartUrlOptions, eliminateZeroDimensions, urlOptions } = chart.getAttributes()

  return [
    ...(chartUrlOptions || chart.getUI().getUrlOptions()),
    ...urlOptions,
    "jsonwrap",
    eliminateZeroDimensions && "nonzero",
    "flip",
    "ms",
    "jw-anomaly-rates",
    "minify",
    "annotations",
  ].filter(Boolean)
}

const oneValueOptions = {
  group_by: ["selected"],
  group_by_label: [],
  aggregation: "avg",
}

const defaultOptionsByLibrary = {
  gauge: oneValueOptions,
  easypiechart: oneValueOptions,
  default: {},
}

export const getChartPayload = chart => {
  const ui = chart.getUI()

  const width = chart.getAttribute("width") || ui.getEstimatedChartWidth() || ui.getChartWidth()

  const pixelsPerPoint = ui.getPixelsPerPoint()
  const { after, before, groupingMethod, groupingTime, chartLibrary } = chart.getAttributes()

  const pointsMultiplier = after < 0 ? 1.5 : 2

  const renderedAt =
    chart.getAttribute("hovering") && chart.getAttribute("renderedAt")
      ? Math.ceil(chart.getAttribute("renderedAt") / 1000)
      : null

  const afterBefore =
    after > 0
      ? { after, before }
      : { after: renderedAt ? renderedAt + after : after, before: renderedAt ? renderedAt : 0 }

  return {
    points: Math.round((width / pixelsPerPoint) * pointsMultiplier),
    format: "json2",
    time_group: groupingMethod,
    time_resampling: groupingTime,
    ...afterBefore,
    ...(defaultOptionsByLibrary[chartLibrary] || defaultOptionsByLibrary.default),
  }
}

export const errorCodesToMessage = {
  ErrAllNodesFailed: "All agents failed to return data",
}
