import { getPointValue } from "@/sdk/makeChart/getPointValue"

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

export const ensureRangeIndex = (packed, seriesIndexes) => {
  if (!packed.rangeMin || !packed.rangeMax) {
    packed.rangeMin = new Float64Array(packed.seriesCount * packed.rangeBlockCount)
    packed.rangeMax = new Float64Array(packed.seriesCount * packed.rangeBlockCount)
    packed.rangeIndexedSeries = new Uint8Array(packed.seriesCount)
    packed.rangeMin.fill(Infinity)
    packed.rangeMax.fill(-Infinity)
    packed.byteLength += packed.rangeMin.byteLength + packed.rangeMax.byteLength
  }

  seriesIndexes.forEach(seriesIndex => {
    if (packed.rangeIndexedSeries[seriesIndex]) return
    packed.rangeIndexedSeries[seriesIndex] = 1
    const blockOffset = seriesIndex * packed.rangeBlockCount
    for (let pointIndex = 0; pointIndex < packed.pointCount; pointIndex++) {
      const value = getPointValue(
        packed.sourceRows[pointIndex]?.[seriesIndex + 1],
        packed.point
      )
      if (!Number.isFinite(value)) continue
      const blockIndex = blockOffset + Math.floor(pointIndex / packed.rangeBlockSize)
      packed.rangeMin[blockIndex] = Math.min(packed.rangeMin[blockIndex], value)
      packed.rangeMax[blockIndex] = Math.max(packed.rangeMax[blockIndex], value)
    }
  })
}

export const getVisibleRange = ({ packed, afterMs, beforeMs, seriesIndexes }) => {
  if (!packed?.pointCount || !seriesIndexes.length) return null
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
    seriesIndexes.length === packed.seriesCount &&
    Number.isFinite(packed.dataMin) &&
    Number.isFinite(packed.dataMax)
  )
    return [packed.dataMin, packed.dataMax]

  ensureRangeIndex(packed, seriesIndexes)
  let min = Infinity
  let max = -Infinity

  seriesIndexes.forEach(seriesIndex => {
    const firstBlock = Math.floor(start / packed.rangeBlockSize)
    const lastBlock = Math.floor(end / packed.rangeBlockSize)
    for (let block = firstBlock; block <= lastBlock; block++) {
      const blockStart = block * packed.rangeBlockSize
      const blockEnd = Math.min(packed.pointCount - 1, blockStart + packed.rangeBlockSize - 1)
      if (blockStart >= start && blockEnd <= end) {
        const blockIndex = seriesIndex * packed.rangeBlockCount + block
        min = Math.min(min, packed.rangeMin[blockIndex])
        max = Math.max(max, packed.rangeMax[blockIndex])
        continue
      }

      const edgeStart = Math.max(start, blockStart)
      const edgeEnd = Math.min(end, blockEnd)
      for (let pointIndex = edgeStart; pointIndex <= edgeEnd; pointIndex++) {
        const value = getPointValue(
          packed.sourceRows[pointIndex]?.[seriesIndex + 1],
          packed.point
        )
        if (!Number.isFinite(value)) continue
        min = Math.min(min, value)
        max = Math.max(max, value)
      }
    }
  })

  return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : null
}
