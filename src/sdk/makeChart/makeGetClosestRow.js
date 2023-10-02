export default chart => {
  let cachedHoverTimestamp = -1
  let cachedHoverRow = -1

  chart.invalidateClosestRowCache = () => {
    cachedHoverTimestamp = -1
    cachedHoverRow = -1
  }

  const getClosestRowBinary = timestamp => {
    const { data } = chart.getPayload()

    if (data.length === 0) return -1

    if (timestamp < data[0][0]) return 0

    if (timestamp > data[data.length - 1][0]) return data.length - 1

    let start = 0
    let end = data.length - 1
    let closest = 0

    while (start <= end) {
      const mid = Math.floor((start + end) / 2)

      if (Math.abs(data[mid][0] - timestamp) < Math.abs(data[closest][0] - timestamp)) closest = mid

      if (data[mid][0] === timestamp) return mid

      if (data[mid][0] < timestamp) start = mid + 1
      else end = mid - 1
    }

    return closest
  }

  chart.getClosestRow = timestamp => {
    if (cachedHoverTimestamp === timestamp) return cachedHoverRow

    cachedHoverTimestamp = timestamp
    cachedHoverRow = getClosestRowBinary(timestamp)

    return cachedHoverRow
  }
}
