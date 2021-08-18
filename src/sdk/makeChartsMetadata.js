import { fetchChartMetadata } from "./api"

export default ({ getChart }) => {
  const byId = {}

  const makeKey = node => {
    const { host, id } = node.getAttributes()
    return `${host}-${id}`
  }

  const get = node => {
    if (getChart) return getChart(node)

    const id = makeKey(node)
    return byId[id]
  }

  const fetch = async node => {
    if (getChart) return

    const response = await fetchChartMetadata(node)
    const id = makeKey(node)
    byId[id] = response

    return response
  }

  return { get, fetch }
}
