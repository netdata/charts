import Dygraph from "dygraphs"
import { getDivergingStackBounds } from "../divergingStack"

const maxPointsPerPixel = 6

const getPointX = point => (Number.isFinite(point?.canvasx) ? point.canvasx : point?.x)

const getPointBounds = point => {
  if (Number.isFinite(point?.baseY) && Number.isFinite(point?.endY)) {
    return { base: point.baseY, end: point.endY }
  }

  return getDivergingStackBounds(point)
}

const getPointDeviation = (seriesPoints, referencePoints, index, firstIndex, lastIndex) => {
  const firstX = getPointX(referencePoints[firstIndex])
  const lastX = getPointX(referencePoints[lastIndex])
  const currentX = getPointX(referencePoints[index])
  const indexProgress = (index - firstIndex) / (lastIndex - firstIndex)
  const hasXProgress = [firstX, currentX, lastX].every(Number.isFinite) && lastX !== firstX
  const progress = hasXProgress ? (currentX - firstX) / (lastX - firstX) : indexProgress
  let deviation = 0

  seriesPoints.forEach(points => {
    const first = getPointBounds(points[firstIndex])
    const current = getPointBounds(points[index])
    const last = getPointBounds(points[lastIndex])

    if (!first || !current || !last) {
      deviation = Infinity
      return
    }

    const expectedBase = first.base + (last.base - first.base) * progress
    const expectedEnd = first.end + (last.end - first.end) * progress

    deviation = Math.max(
      deviation,
      Math.abs(current.base - expectedBase),
      Math.abs(current.end - expectedEnd)
    )
  })

  return deviation
}

const appendBucket = (target, bucket, seriesPoints, referencePoints) => {
  if (!bucket.length) return
  if (bucket.length <= maxPointsPerPixel) {
    target.push(...bucket)
    return
  }

  const indexes = new Set([0, bucket.length - 1])
  const firstIndex = bucket[0]
  const lastIndex = bucket[bucket.length - 1]
  const candidates = bucket.slice(1, -1).map((index, bucketIndex) => ({
    bucketIndex: bucketIndex + 1,
    deviation: getPointDeviation(seriesPoints, referencePoints, index, firstIndex, lastIndex),
  }))

  candidates
    .sort((a, b) => b.deviation - a.deviation || a.bucketIndex - b.bucketIndex)
    .slice(0, maxPointsPerPixel - indexes.size)
    .forEach(({ bucketIndex }) => indexes.add(bucketIndex))

  Array.from(indexes)
    .sort((a, b) => a - b)
    .forEach(bucketIndex => target.push(bucket[bucketIndex]))
}

export const selectStackedAreaPointIndexes = (seriesPoints, width) => {
  const stackedSeriesPoints = seriesPoints.filter(points => points?.some(getPointBounds))
  if (!stackedSeriesPoints.length) return null

  const referencePoints = stackedSeriesPoints.reduce((longest, points) =>
    points.length > longest.length ? points : longest
  )
  const pointCount = referencePoints.length
  if (!Number.isFinite(width) || width <= 0 || pointCount <= width * 2) return null

  const selected = []
  let bucket = []
  let pixel = null

  for (let index = 0; index < pointCount; index++) {
    const point = referencePoints[index]
    const x = getPointX(point)

    if (!Number.isFinite(x)) {
      appendBucket(selected, bucket, stackedSeriesPoints, referencePoints)
      bucket = []
      pixel = null
      selected.push(index)
      continue
    }

    const nextPixel = Math.round(x)
    if (pixel !== null && nextPixel !== pixel) {
      appendBucket(selected, bucket, stackedSeriesPoints, referencePoints)
      bucket = []
    }

    pixel = nextPixel
    bucket.push(index)
  }

  appendBucket(selected, bucket, stackedSeriesPoints, referencePoints)

  return selected
}

export const reduceStackedAreaPoints = (points, selectedIndexes) =>
  selectedIndexes ? selectedIndexes.map(index => points[index] ?? null) : points

const makeFillPlotter = () => {
  let cachedSeriesPoints
  let cachedWidth
  let selectedIndexes

  return plotter => {
    const { drawingContext: ctx, dygraph, points, plotArea, seriesIndex, setName } = plotter
    const allSeriesPoints = plotter.allSeriesPoints || [points]
    const stepPlot = dygraph.getBooleanOption("stepPlot", setName)

    if (seriesIndex === 0 || cachedSeriesPoints !== allSeriesPoints || cachedWidth !== plotArea.w) {
      cachedSeriesPoints = allSeriesPoints
      cachedWidth = plotArea.w
      selectedIndexes = selectStackedAreaPointIndexes(allSeriesPoints, plotArea.w)
    }

    ctx.fillStyle = plotter.color
    ctx.globalAlpha = dygraph.getNumericOption("fillAlpha", setName)
    ctx.beginPath()

    const renderPoints = reduceStackedAreaPoints(points, selectedIndexes).map(point => {
      const bounds = getDivergingStackBounds(point)
      if (!bounds) return null

      const baseY = dygraph.toDomYCoord(bounds.base)
      const endY = dygraph.toDomYCoord(bounds.end)
      if (!Number.isFinite(point.canvasx) || !Number.isFinite(baseY) || !Number.isFinite(endY))
        return null

      return {
        x: point.canvasx,
        baseY,
        endY,
      }
    })

    let previous

    renderPoints.forEach(current => {
      if (!current) {
        previous = null
        return
      }

      if (previous) {
        ctx.moveTo(previous.x, previous.endY)

        if (stepPlot) {
          ctx.lineTo(current.x, previous.endY)
          ctx.lineTo(current.x, current.endY)
        } else {
          ctx.lineTo(current.x, current.endY)
        }

        ctx.lineTo(current.x, current.baseY)
        ctx.lineTo(previous.x, previous.baseY)
        ctx.closePath()
      }

      previous = current
    })

    ctx.fill()
  }
}

const makeLinePlotter = () => plotter => {
  plotter.points.forEach(point => {
    const bounds = getDivergingStackBounds(point)
    if (bounds) point.canvasy = plotter.dygraph.toDomYCoord(bounds.end)
  })

  Dygraph.Plotters.linePlotter(plotter)
}

export default () => [makeFillPlotter(), makeLinePlotter()]
