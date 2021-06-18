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
  const { context } = chart.getMetadata()
  const { after, before, dimensions, groupingMethod, groupingTime } = chart.getAttributes()

  return {
    chart: context,
    format: "json",
    points: Math.round(width / pixelsPerPoint),
    group: groupingMethod,
    gtime: groupingTime,
    options: getChartURLOptions(chart),
    after,
    ...(after > 0 && { before }),
    ...(dimensions && { dimensions }),
    _: Date.now(),
  }
}

export const fetchChartData = chart => {
  console.log("fetchChartData")
  const { host } = chart.getAttributes()

  const payload = getChartPayload(chart)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}?${query}`

  return fetch(url).then(response => response.json())
}

export const fetchChartMetadata = () => {
  throw new Error("not implemented")
}
