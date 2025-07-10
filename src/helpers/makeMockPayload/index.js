const getPostAggregatedData = (postAggregatedData, index) => {
  if (!postAggregatedData) return null

  return Object.keys(postAggregatedData).reduce((acc, key) => {
    const series = postAggregatedData[key]
    acc[key] = [...series.slice(index), ...series.slice(0, index)]

    return acc
  }, {})
}

export default (payload, { delay = 0 } = {}) =>
  async chart => {
    await new Promise(r => setTimeout(r, delay))

    const { after, before } = chart.getAttributes()

    const now = Date.now()

    if (Array.isArray(payload.result)) {
      before, after

      if (after > 0) return { ...payload, after, before }

      const nowSec = now / 1000
      return { ...payload, after: nowSec + after, before: nowSec }
    }

    const { data, post_aggregated_data } = payload.result

    const [first] = data
    const points = data.length
    const last = data[data.length - 1]

    const duration = last[0] - first[0]

    const nextFirst = after > 0 ? after * 1000 : now + after * 1000
    const nextLast = after > 0 ? before * 1000 : now

    const nextFreq = Math.round(nextLast - nextFirst) / points

    let nextIndex
    const nextData = Array.from(Array(points)).map((v, index) => {
      const timestamp = nextFirst + nextFreq * index

      const targetTimestamp = first[0] + (timestamp % duration)

      const dataIndex = data.findIndex(([t]) => t >= targetTimestamp)
      if (index === 0) {
        nextIndex = dataIndex
      }

      const [, ...row] = data[dataIndex]

      return [timestamp, ...row]
    })

    const nextPostAggregatedData =
      post_aggregated_data && getPostAggregatedData(post_aggregated_data, nextIndex)

    return {
      ...payload,
      result: {
        ...payload.result,
        data: nextData,
        ...(nextPostAggregatedData && { post_aggregated_data: nextPostAggregatedData }),
      },
    }
  }
