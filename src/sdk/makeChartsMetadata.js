import { fetchChartMetadata } from "./api"

export default ({ getChart }) => {
  const byId = {}

  const makeKey = node => {
    const { host, id } = node.getAttributes()
    return `${host}-${id}`
  }

  const get = node => {
    const id = makeKey(node)
    if (byId[id]) return byId[id]

    if (getChart) {
      byId[id] = getChart(node)
      return byId[id]
    }

    return byId[id]
  }

  const set = (node, values = {}) => {
    const id = makeKey(node)
    byId[id] = {
      ...byId[id],
      ...values,
    }
  }

  const fetch = async node => {
    if (getChart) return

    const response = await fetchChartMetadata(node)

    const id = makeKey(node)
    byId[id] = {
      ...byId[id],
      ...response,
    }

    return response
  }

  return { get, set, fetch }
}
