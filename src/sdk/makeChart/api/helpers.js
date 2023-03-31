const defaultUrlOptionsByLibrary = {
  gauge: oneValueOptions,
  easypiechart: oneValueOptions,
  number: oneValueOptions,
  default: {},
}

export const getChartURLOptions = chart => {
  const { chartUrlOptions = [], eliminateZeroDimensions, urlOptions } = chart.getAttributes()

  return [
    ...chartUrlOptions,
    ...urlOptions,
    "jsonwrap",
    eliminateZeroDimensions && "nonzero",
    "flip",
    "ms",
    "jw-anomaly-rates",
    "minify",
    "group-by-labels",
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
  number: oneValueOptions,
  default: {},
}

export const getChartPayload = chart => {
  const ui = chart.getUI()

  const width = chart.getAttribute("width") || ui.getChartWidth()

  const pixelsPerPoint = ui.getPixelsPerPoint()
  const { after, before, groupingMethod, groupingTime, chartLibrary, fetchStartedAt } =
    chart.getAttributes()

  const pointsMultiplier = after < 0 ? 1.5 : 2

  const renderedAt =
    chart.getAttribute("hovering") && chart.getAttribute("renderedAt")
      ? Math.ceil(chart.getAttribute("renderedAt") / 1000)
      : null

  const afterBefore =
    after > 0
      ? { after, before }
      : {
          after: renderedAt ? renderedAt + after : Math.ceil(fetchStartedAt / 1000) + after,
          before: renderedAt ? renderedAt : Math.ceil(fetchStartedAt / 1000),
        }

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
