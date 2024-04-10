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
    chartLibrary !== "table" && eliminateZeroDimensions && "nonzero",
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
  heatmap: 0.7,
  default: 0.7,
}

export const getChartPayload = chart => {
  const ui = chart.getUI()
  const width = chart.getAttribute("containerWidth") || ui.getChartWidth()

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

  const points = Math.round((width / pixelsPerPoint) * pointsMultiplier)
  return {
    points: isNaN(points) ? 300 : points,
    format: "json2",
    time_group: groupingMethod,
    time_resampling: groupingTime,
    ...afterBefore,
  }
}

export const errorCodesToMessage = {
  ErrAllNodesFailed: "All agents failed to return data",
}
