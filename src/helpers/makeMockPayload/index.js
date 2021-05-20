export default (payload, { delay = 0 } = {}) => async ({ after, before }) => {
  const { data } = payload.result
  const [first] = data
  const points = data.length
  const last = data[data.length - 1]

  const duration = last[0] - first[0]
  const now = Date.now()
  const nextFirst = after > 0 ? after * 1000 : now + after * 1000
  const nextLast = after > 0 ? before * 1000 : now

  const nextFreq = Math.round(nextLast - nextFirst) / points

  const nextData = Array.from(Array(points)).map((v, index) => {
    const timestamp = nextFirst + nextFreq * index

    const targetTimestamp = first[0] + (timestamp % duration)

    const [, ...row] = data.find(([t]) => t >= targetTimestamp)

    return [timestamp, ...row]
  })

  await new Promise(r => setTimeout(r, delay))

  return { ...payload, result: { ...payload.result, data: nextData } }
}
