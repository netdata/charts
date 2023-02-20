import { getChartURLOptions, getChartPayload } from "./helpers"

const getPayload = chart => {
  const metadata = chart.getMetadata()
  const { chartId, context, dimensions } = chart.getAttributes()

  return {
    v2: "",
    chart: metadata.id || chartId || metadata.context || context,
    format: "json",
    options: getChartURLOptions(chart).join("|"),
    _: Date.now(),
    ...(dimensions.length && { dimensions: dimensions.join("|") }),
    ...getChartPayload(chart),
  }
}

export default (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getPayload(chart)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}?${query}`

  return fetch(url, options).then(response => response.json())
}
