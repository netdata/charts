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
  "group_by_label[0]": attrs["group_by_label[0]"] || [],
  "aggregation[0]": attrs["aggregation[0]"] || "sum",
})

const getDefaultOptionsByLibrary = {
  gauge: oneValueOptions,
  easypiechart: oneValueOptions,
  number: oneValueOptions,
  default: attrs => ({
    "group_by[0]": attrs["group_by[0]"],
    "group_by_label[0]": attrs["group_by_label[0]"],
    "aggregation[0]": attrs["aggregation[0]"],
  }),
}

export const pointMultiplierByChartType = {
  multiBar: 0.1,
  stackedBar: 0.1,
  heatmap: 0.7,
  default: 0.7,
}

export const getChartPayload = chart => {
  const ui = chart.getUI()
  const width = ui.getChartWidth()

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
    pixelsPerPoint,
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
    ...(!!restAttributes["group_by[1]"] && {
      "group_by[1]": restAttributes["group_by[1]"],
      "group_by_label[1]": restAttributes["group_by_label[1]"],
      "aggregation[1]": restAttributes["aggregation[1]"],
    }),
  }
}

export const errorCodesToMessage = {
  ErrAllNodesFailed: "All agents failed to return data",
}
