const defaultUrlOptionsByLibrary = {
  groupBoxes: ["group-by-labels"],
  default: [],
}

export const getChartURLOptions = chart => {
  const { eliminateZeroDimensions, urlOptions = [], chartLibrary } = chart.getAttributes()
  const opts = defaultUrlOptionsByLibrary[chartLibrary] || defaultUrlOptionsByLibrary.default

  return [
    ...urlOptions,
    "jsonwrap",
    eliminateZeroDimensions && "nonzero",
    "flip",
    "ms",
    "jw-anomaly-rates",
    "minify",
    ...opts,
  ].filter(Boolean)
}

const oneValueOptions = attrs => ({
  "group_by[0]": attrs["group_by[0]"] || ["instance"],
  "group_by[1]": attrs["group_by[1]"] || ["selected"],
  "group_by_label[0]": attrs["group_by_label[0]"] || [],
  "group_by_label[1]": attrs["group_by_label[1]"] || [],
  "aggregation[0]": attrs["aggregation[0]"] || "sum",
  "aggregation[1]": attrs["aggregation[1]"] || "avg",
})

const getDefaultOptionsByLibrary = {
  gauge: oneValueOptions,
  easypiechart: oneValueOptions,
  number: oneValueOptions,
  default: () => {},
}

const pointMultiplierByChartType = {
  multiBar: 0.1,
  stackedBar: 0.1,
  default: 2,
}

export const getChartPayload = chart => {
  const ui = chart.getUI()

  const width = chart.getAttribute("width") || ui.getChartWidth()

  const pixelsPerPoint = chart.getPixelsPerPoint()
  const {
    after,
    before,
    groupingMethod,
    groupingTime,
    chartLibrary,
    renderedAt,
    hovering,
    fetchStartedAt,
    chartType,
    ...restAttributes
  } = chart.getAttributes()

  const pointsMultiplier =
    pointMultiplierByChartType[chartType] || pointMultiplierByChartType.default

  const fetchOn =
    hovering && renderedAt ? Math.ceil(renderedAt / 1000) : Math.ceil(fetchStartedAt / 1000)

  const afterBefore =
    after > 0
      ? { after, before }
      : {
          after: fetchOn + after,
          before: fetchOn,
        }

  return {
    points: Math.round((width / pixelsPerPoint) * pointsMultiplier),
    format: "json2",
    time_group: groupingMethod,
    time_resampling: groupingTime,
    ...afterBefore,
    ...(getDefaultOptionsByLibrary[chartLibrary] || getDefaultOptionsByLibrary.default)(
      restAttributes
    ),
  }
}

export const errorCodesToMessage = {
  ErrAllNodesFailed: "All agents failed to return data",
}
