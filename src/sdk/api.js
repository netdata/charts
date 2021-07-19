const getChartURLOptions = chart => {
  const { chartUrlOptions, urlOptions, eliminateZeroDimensions } = chart.getAttributes()

  return [
    ...(chartUrlOptions || chart.getUI().getUrlOptions()),
    ...urlOptions,
    "jsonwrap",
    eliminateZeroDimensions && "nonzero",
  ]
    .filter(Boolean)
    .join("|")
}

const getChartPayload = chart => {
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

const getSingleChartPayload = chart => {
  const { id, context } = chart.getMetadata()
  // const { dimensions } = chart.getAttributes()

  return {
    chart: id || context,
    format: "json",
    options: getChartURLOptions(chart),
    // ...(dimensions && { dimensions }),
    _: Date.now(),
    ...getChartPayload(chart),
  }
}

const fetchSingleChartData = (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getSingleChartPayload(chart)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}?${query}`

  return fetch(url, options).then(response => response.json())
}

const getCompositeChartPayload = chart => {
  const { context } = chart.getMetadata()
  const { nodeIds /* dimensions */ } = chart.getAttributes()

  const filter = { nodeIDs: nodeIds, context }
  const aggregations = []

  return {
    filter,
    aggregations,
    // ...(dimensions && { dimensions }),
    agent_options: getChartURLOptions(chart),
    ...getChartPayload(chart),
  }
}

const fetchCompositeChartData = (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getCompositeChartPayload(chart)

  return fetch(host, {
    method: "POST",
    body: JSON.stringify(payload),
    ...options,
  }).then(response => response.json())
}

export const fetchChartData = (chart, options) => {
  const { composite } = chart.getAttributes()

  return composite ? fetchCompositeChartData(chart, options) : fetchSingleChartData(chart, options)
}

export const fetchChartMetadata = () => {
  throw new Error("not implemented")
}
