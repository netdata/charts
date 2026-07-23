const defaultUrlOptionsByLibrary = {
  groupBoxes: ["group-by-labels"],
  default: [],
}

export const getChartURLOptions = chart => {
  const {
    eliminateZeroDimensions,
    urlOptions = [],
    chartLibrary,
    chartType,
    nulls2zero,
  } = chart.getAttributes()
  const opts = defaultUrlOptionsByLibrary[chartLibrary] || defaultUrlOptionsByLibrary.default
  const canEliminateZeroDimensions = chartLibrary !== "table" && chartType !== "heatmap"

  return [
    ...urlOptions,
    "jsonwrap",
    canEliminateZeroDimensions && eliminateZeroDimensions && "nonzero",
    nulls2zero && "null2zero",
    "flip",
    "ms",
    "jw-anomaly-rates",
    "minify",
    ...opts,
  ].filter(Boolean)
}

export const pointMultiplierByChartType = {
  multiBar: 0.1,
  stackedBar: 0.1,
  table: 0.1,
  heatmap: 0.7,
  default: 0.7,
}

export const getLiveFetchBefore = ({
  after,
  renderedAt,
  hovering,
  fetchStartedAt,
  viewUpdateEvery,
}) => {
  if (after > 0) return null
  if (viewUpdateEvery && viewUpdateEvery > Math.abs(after)) return null

  return hovering && renderedAt ? Math.ceil(renderedAt / 1000) : Math.ceil(fetchStartedAt / 1000)
}

export const getChartPayload = (chart, attrs = {}) => {
  const ui = chart.getUI()
  const width = chart.getAttribute("containerWidth", ui.getChartWidth())

  const {
    after,
    before,
    groupingMethod,
    groupingTime,
    renderedAt,
    hovering,
    fetchStartedAt,
    chartType,
    pixelsPerPoint,
    chartLibrary,
    points: customPoints,
    viewUpdateEvery,
  } = { ...chart.getAttributes(), ...attrs }

  const pointsMultiplier =
    pointMultiplierByChartType[chartType] ||
    pointMultiplierByChartType[chartLibrary] ||
    pointMultiplierByChartType.default

  const fetchBefore = getLiveFetchBefore({
    after,
    renderedAt,
    hovering,
    fetchStartedAt,
    viewUpdateEvery,
  })

  const afterBefore =
    after > 0
      ? { after, before }
      : fetchBefore === null
        ? {
            after,
            before: 0,
          }
        : {
            after: fetchBefore + after,
            before: fetchBefore,
          }

  const points = customPoints || Math.round((width / pixelsPerPoint) * pointsMultiplier)

  return {
    points: isNaN(points) ? 300 : points,
    format: "json2",
    time_group: groupingMethod,
    time_resampling: groupingTime,
    ...afterBefore,
  }
}

export const getChartDataRequestAttributes = (chart, attrs = {}) => ({
  ...chart.getAttributes(),
  ...attrs,
  ...getChartPayload(chart, attrs),
  host: chart.getAttribute("host"),
  selectedNodes: chart.getFilteredNodeIds(),
  options: getChartURLOptions(chart),
})

export const errorCodesToMessage = {
  ErrAllNodesFailed: "All agents failed to return data",
}
