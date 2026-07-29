import { getPointValue } from "@/sdk/makeChart/getPointValue"

export const RANGE_BLOCK_SIZE = 32

export const makePointValueReader = point => {
  const valueIndex = point?.value
  return typeof valueIndex === "number"
    ? cell => (Array.isArray(cell) ? cell[valueIndex] : getPointValue(cell, point))
    : cell => (cell !== null && typeof cell === "object" ? cell.value : cell)
}

const getFiniteRange = (rows, seriesCount, point, range) => {
  let min = Number.isFinite(range?.[0]) ? range[0] : Infinity
  let max = Number.isFinite(range?.[1]) ? range[1] : -Infinity
  if (Number.isFinite(min) && Number.isFinite(max)) return [min, max]

  min = Infinity
  max = -Infinity
  for (const row of rows) {
    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
      const value = getPointValue(row[seriesIndex + 1], point)
      if (!Number.isFinite(value)) continue
      min = Math.min(min, value)
      max = Math.max(max, value)
    }
  }
  return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : [0, 1]
}

export const packAlignedData = (rows, seriesCount, point, range) => {
  const pointCount = rows.length
  const xOriginMs = pointCount ? rows[0][0] : 0
  const [yOrigin, yMax] = getFiniteRange(rows, seriesCount, point, range)
  const yScale = yMax === yOrigin ? Math.abs(yOrigin || 1) : yMax - yOrigin
  const x = new Float32Array(pointCount)
  const y = new Float32Array(pointCount * seriesCount)
  const rangeBlockCount = Math.ceil(pointCount / RANGE_BLOCK_SIZE)
  const gapEdgeIndexes = Array.from({ length: seriesCount }, () => [])
  const previousValid = new Uint8Array(seriesCount)
  const readValue = makePointValueReader(point)
  let dataMin = Infinity
  let dataMax = -Infinity

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const row = rows[pointIndex]
    x[pointIndex] = (row[0] - xOriginMs) / 1000

    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
      const value = readValue(row[seriesIndex + 1])
      const valid = Number.isFinite(value)
      y[seriesIndex * pointCount + pointIndex] = valid ? (value - yOrigin) / yScale : NaN
      if (pointIndex > 0) {
        if (valid && !previousValid[seriesIndex]) gapEdgeIndexes[seriesIndex].push(pointIndex)
        else if (!valid && previousValid[seriesIndex])
          gapEdgeIndexes[seriesIndex].push(pointIndex - 1)
      }
      previousValid[seriesIndex] = valid ? 1 : 0
      if (valid) {
        dataMin = Math.min(dataMin, value)
        dataMax = Math.max(dataMax, value)
      }
    }
  }

  return {
    sourceRows: rows,
    point,
    xOriginMs,
    yOrigin,
    yScale,
    x,
    y,
    pointCount,
    seriesCount,
    rangeBlockSize: RANGE_BLOCK_SIZE,
    rangeBlockCount,
    rangeMin: null,
    rangeMax: null,
    rangeIndexedSeries: null,
    dataMin,
    dataMax,
    gapEdgeIndexes,
    byteLength: x.byteLength + y.byteLength,
  }
}

export default chart => {
  let source = null
  let dimensionKey = null
  let pointSchema = null
  let rangeKey = null
  let packed = null

  const get = () => {
    const { data, point } = chart.getPayload()
    const dimensionIds = chart.getPayloadDimensionIds()
    if (chart.getAttribute("outOfLimits") || !data?.length || !dimensionIds.length) return null

    const nextDimensionKey = dimensionIds.join("\u0000")
    const min = chart.getAttribute("min")
    const max = chart.getAttribute("max")
    const nextRangeKey = `${min}\u0000${max}`
    if (
      source === data &&
      dimensionKey === nextDimensionKey &&
      pointSchema === point &&
      rangeKey === nextRangeKey
    )
      return packed

    source = data
    dimensionKey = nextDimensionKey
    pointSchema = point
    rangeKey = nextRangeKey
    packed = packAlignedData(data, dimensionIds.length, point, [min, max])
    return packed
  }

  const clear = () => {
    source = null
    dimensionKey = null
    pointSchema = null
    rangeKey = null
    packed = null
  }

  return { get, clear }
}
