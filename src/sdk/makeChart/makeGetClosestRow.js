export default getPayload => {
  let cachedHoverTimestamp = -1
  let cachedHoverRow = -1

  const invalidateClosestRowCache = () => {
    cachedHoverTimestamp = -1
    cachedHoverRow = -1
  }

  const getClosestRowBinary = timestamp => {
    const {
      result: { data },
    } = getPayload()

    if (data.length === 0) return -1

    if (timestamp < data[0][0]) return 0

    if (timestamp > data[data.length - 1][0]) return data.length - 1

    let start = 0
    let end = data.length - 1

    while (start < end) {
      const mid = Math.floor((start + end) / 2)

      if (data[mid][0] === timestamp) return mid

      if (data[mid][0] < timestamp) start = mid + 1
      else end = mid - 1
    }

    return start
  }

  const getClosestRow = timestamp => {
    if (cachedHoverTimestamp === timestamp) return cachedHoverRow

    cachedHoverTimestamp = timestamp
    cachedHoverRow = getClosestRowBinary(timestamp)

    return cachedHoverRow
  }

  return { invalidateClosestRowCache, getClosestRow }
}
