import { getPointValue } from "@/sdk/makeChart/getPointValue"

export const packAlignedData = (rows, seriesCount, point) => {
  const pointCount = rows.length
  const xOriginMs = pointCount ? rows[0][0] : 0
  const x = new Float32Array(pointCount)
  const y = new Float32Array(pointCount * seriesCount)

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const row = rows[pointIndex]
    x[pointIndex] = (row[0] - xOriginMs) / 1000

    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
      const value = getPointValue(row[seriesIndex + 1], point)
      y[seriesIndex * pointCount + pointIndex] = value == null ? NaN : value
    }
  }

  return {
    xOriginMs,
    x,
    y,
    pointCount,
    seriesCount,
    byteLength: x.byteLength + y.byteLength,
  }
}

export default chart => {
  let source = null
  let dimensionKey = null
  let pointSchema = null
  let packed = null

  const get = () => {
    const { data, point } = chart.getPayload()
    const dimensionIds = chart.getPayloadDimensionIds()
    if (chart.getAttribute("outOfLimits") || !data?.length || !dimensionIds.length) return null

    const nextDimensionKey = dimensionIds.join("\u0000")
    if (source === data && dimensionKey === nextDimensionKey && pointSchema === point) return packed

    source = data
    dimensionKey = nextDimensionKey
    pointSchema = point
    packed = packAlignedData(data, dimensionIds.length, point)
    return packed
  }

  const clear = () => {
    source = null
    dimensionKey = null
    pointSchema = null
    packed = null
  }

  return { get, clear }
}
