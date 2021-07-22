import { getChartURLOptions, getChartPayload } from "./helpers"

const getSingleChartPayload = chart => {
  const { id, context } = chart.getMetadata()

  return {
    chart: id || context,
    format: "json",
    options: getChartURLOptions(chart).join("|"),
    _: Date.now(),
    ...getChartPayload(chart),
  }
}

export default (chart, options) => {
  const { host } = chart.getAttributes()

  const payload = getSingleChartPayload(chart)

  const query = new URLSearchParams(payload).toString()
  const url = `${host}?${query}`

  return fetch(url, options).then(response => response.json())
}
