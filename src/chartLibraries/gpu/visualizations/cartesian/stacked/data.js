import {
  RANGE_BLOCK_SIZE,
  makePointValueReader,
} from "@/chartLibraries/gpu/visualizations/cartesian/line/data"

const lowerBound = (values, target) => {
  let low = 0
  let high = values.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (values[middle] < target) low = middle + 1
    else high = middle
  }
  return low
}

const upperBound = (values, target) => {
  let low = 0
  let high = values.length
  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    if (values[middle] <= target) low = middle + 1
    else high = middle
  }
  return low - 1
}

const makeVisibility = (seriesCount, visibleSeriesIndexes) => {
  const visibleSeries = new Uint8Array(seriesCount)
  visibleSeriesIndexes.forEach(index => {
    if (index >= 0 && index < seriesCount) visibleSeries[index] = 1
  })
  return visibleSeries
}

export const makeDivergingStackedBounds = (row, seriesCount, point, visibleSeries) => {
  const bounds = Array(seriesCount).fill(null)
  const readValue = makePointValueReader(point)
  let positive = 0
  let negative = 0

  for (let seriesIndex = seriesCount - 1; seriesIndex >= 0; seriesIndex--) {
    if (!visibleSeries[seriesIndex]) continue
    const value = readValue(row?.[seriesIndex + 1])
    if (!Number.isFinite(value)) continue
    const base = value < 0 ? negative : positive
    const end = base + value
    if (value < 0) negative = end
    else positive = end
    bounds[seriesIndex] = { base, end }
  }

  return bounds
}

export const packDivergingStackedData = (
  rows,
  seriesCount,
  point,
  visibleSeriesIndexes
) => {
  const pointCount = rows.length
  const totalValues = pointCount * seriesCount
  const xOriginMs = pointCount ? rows[0][0] : 0
  const x = new Float32Array(pointCount)
  const baseRaw = new Float64Array(totalValues)
  const visibleSeries = makeVisibility(seriesCount, visibleSeriesIndexes)
  const rangeBlockCount = Math.ceil(pointCount / RANGE_BLOCK_SIZE)
  const stackRangeMin = new Float64Array(rangeBlockCount)
  const stackRangeMax = new Float64Array(rangeBlockCount)
  stackRangeMin.fill(Infinity)
  stackRangeMax.fill(-Infinity)
  const gapEdgeIndexes = Array.from({ length: seriesCount }, () => [])
  const previousValid = new Uint8Array(seriesCount)
  const readValue = makePointValueReader(point)
  let dataMin = Infinity
  let dataMax = -Infinity
  let storageMin = Infinity
  let storageMax = -Infinity

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const row = rows[pointIndex]
    x[pointIndex] = (row[0] - xOriginMs) / 1000
    let positive = 0
    let negative = 0

    const block = Math.floor(pointIndex / RANGE_BLOCK_SIZE)
    for (let seriesIndex = seriesCount - 1; seriesIndex >= 0; seriesIndex--) {
      const offset = pointIndex * seriesCount + seriesIndex
      const value = readValue(row[seriesIndex + 1])
      const valid = Boolean(visibleSeries[seriesIndex] && Number.isFinite(value))
      if (pointIndex > 0) {
        if (valid && !previousValid[seriesIndex]) gapEdgeIndexes[seriesIndex].push(pointIndex)
        else if (!valid && previousValid[seriesIndex])
          gapEdgeIndexes[seriesIndex].push(pointIndex - 1)
      }
      previousValid[seriesIndex] = valid ? 1 : 0
      if (!valid) {
        baseRaw[offset] = NaN
        continue
      }

      const base = value < 0 ? negative : positive
      const end = base + value
      if (value < 0) negative = end
      else positive = end
      baseRaw[offset] = base
      if (end < dataMin) dataMin = end
      if (end > dataMax) dataMax = end
      if (base < storageMin) storageMin = base
      if (end < storageMin) storageMin = end
      if (base > storageMax) storageMax = base
      if (end > storageMax) storageMax = end
      if (end < stackRangeMin[block]) stackRangeMin[block] = end
      if (end > stackRangeMax[block]) stackRangeMax[block] = end
    }
  }

  const yOrigin = Number.isFinite(storageMin) ? storageMin : 0
  const yMax = Number.isFinite(storageMax) ? storageMax : 1
  const yScale = yMax === yOrigin ? Math.abs(yOrigin || 1) : yMax - yOrigin
  const base = new Float32Array(totalValues)
  const y = new Float32Array(totalValues)
  const inverseYScale = 1 / yScale

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex++) {
    const row = rows[pointIndex]
    for (let seriesIndex = 0; seriesIndex < seriesCount; seriesIndex++) {
      const offset = pointIndex * seriesCount + seriesIndex
      const rawBase = baseRaw[offset]
      if (!Number.isFinite(rawBase)) {
        base[offset] = NaN
        y[offset] = NaN
        continue
      }
      const value = readValue(row[seriesIndex + 1])
      base[offset] = (rawBase - yOrigin) * inverseYScale
      y[offset] = (rawBase + value - yOrigin) * inverseYScale
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
    base,
    pointCount,
    seriesCount,
    layout: "row-major",
    visibleSeries,
    rangeBlockSize: RANGE_BLOCK_SIZE,
    rangeBlockCount,
    stackRangeMin,
    stackRangeMax,
    dataMin,
    dataMax,
    gapEdgeIndexes,
    byteLength:
      x.byteLength +
      y.byteLength +
      base.byteLength +
      visibleSeries.byteLength +
      stackRangeMin.byteLength +
      stackRangeMax.byteLength,
  }
}

export const getVisibleStackedRange = ({ packed, afterMs, beforeMs }) => {
  if (!packed?.pointCount) return null
  const after = (Math.min(afterMs, beforeMs) - packed.xOriginMs) / 1000
  const before = (Math.max(afterMs, beforeMs) - packed.xOriginMs) / 1000
  const first = lowerBound(packed.x, after)
  const last = upperBound(packed.x, before)
  if (first > last || first >= packed.pointCount || last < 0) return null

  const start = Math.max(0, first)
  const end = Math.min(packed.pointCount - 1, last)
  if (
    start === 0 &&
    end === packed.pointCount - 1 &&
    Number.isFinite(packed.dataMin) &&
    Number.isFinite(packed.dataMax)
  )
    return [packed.dataMin, packed.dataMax]

  let min = Infinity
  let max = -Infinity
  const firstBlock = Math.floor(start / packed.rangeBlockSize)
  const lastBlock = Math.floor(end / packed.rangeBlockSize)
  for (let block = firstBlock; block <= lastBlock; block++) {
    const blockStart = block * packed.rangeBlockSize
    const blockEnd = Math.min(
      packed.pointCount - 1,
      blockStart + packed.rangeBlockSize - 1
    )
    if (blockStart >= start && blockEnd <= end) {
      min = Math.min(min, packed.stackRangeMin[block])
      max = Math.max(max, packed.stackRangeMax[block])
      continue
    }

    const edgeStart = Math.max(start, blockStart)
    const edgeEnd = Math.min(end, blockEnd)
    for (let pointIndex = edgeStart; pointIndex <= edgeEnd; pointIndex++) {
      makeDivergingStackedBounds(
        packed.sourceRows[pointIndex],
        packed.seriesCount,
        packed.point,
        packed.visibleSeries
      ).forEach(bounds => {
        if (!bounds) return
        min = Math.min(min, bounds.end)
        max = Math.max(max, bounds.end)
      })
    }
  }

  return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : null
}

export default chart => {
  let source = null
  let dimensionKey = null
  let pointSchema = null
  let visibilityKey = null
  let packed = null

  const get = () => {
    const { data, point } = chart.getPayload()
    const dimensionIds = chart.getPayloadDimensionIds()
    if (chart.getAttribute("outOfLimits") || !data?.length || !dimensionIds.length) return null

    const selected = chart.getAttribute("selectedLegendDimensions") || []
    const visibleSeriesIndexes = dimensionIds.reduce((indexes, id, index) => {
      if (!selected.length || chart.isDimensionVisible(id)) indexes.push(index)
      return indexes
    }, [])
    const nextDimensionKey = dimensionIds.join("\u0000")
    const nextVisibilityKey = visibleSeriesIndexes.join("\u0000")
    if (
      source === data &&
      dimensionKey === nextDimensionKey &&
      pointSchema === point &&
      visibilityKey === nextVisibilityKey
    )
      return packed

    source = data
    dimensionKey = nextDimensionKey
    pointSchema = point
    visibilityKey = nextVisibilityKey
    packed = packDivergingStackedData(
      data,
      dimensionIds.length,
      point,
      visibleSeriesIndexes
    )
    return packed
  }

  const clear = () => {
    source = null
    dimensionKey = null
    pointSchema = null
    visibilityKey = null
    packed = null
  }

  return { get, clear }
}
