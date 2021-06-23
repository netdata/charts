import { fetchChartMetadata } from "./api"

export default ({ getChart }) => {
  const byId = {}

  const makeKey = (host, context) => `${host}-${context}`

  const get = (host, context) => {
    if (getChart) return getChart(host, context)

    const id = makeKey(host, context)
    return byId[id]
  }

  const fetch = async (host, context) => {
    if (getChart) return

    const response = await fetchChartMetadata(host, context)
    const id = makeKey(host, context)
    byId[id] = response

    return response
  }

  return { get, fetch }
}
