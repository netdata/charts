export default (payload, { delay = 0 } = {}) => async chart => {
  await new Promise(r => setTimeout(r, delay))

  const { after, before } = chart.getAttributes()

  const now = Date.now()

  if (Array.isArray(payload.result)) {
    before, after

    if (after > 0) return { ...payload, after, before }

    const nowSec = now / 1000
    return { ...payload, after: nowSec + after, before: nowSec }
  }

  const { data } = payload.result

  const [first] = data
  const points = data.length
  const last = data[data.length - 1]

  const duration = last[0] - first[0]

  const nextFirst = after > 0 ? after * 1000 : now + after * 1000
  const nextLast = after > 0 ? before * 1000 : now

  const nextFreq = Math.round(nextLast - nextFirst) / points

  const nextData = Array.from(Array(points)).map((v, index) => {
    const timestamp = nextFirst + nextFreq * index

    const targetTimestamp = first[0] + (timestamp % duration)

    const [, ...row] = data.find(([t]) => t >= targetTimestamp)

    return [timestamp, ...row]
  })

  return { ...payload, result: { ...payload.result, data: nextData } }
}
