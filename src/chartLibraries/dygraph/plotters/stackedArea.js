import Dygraph from "dygraphs"
import { getDivergingStackBounds } from "../divergingStack"

const appendBucket = (target, bucket) => {
  if (!bucket.length) return
  if (bucket.length <= 6) {
    target.push(...bucket)
    return
  }

  const indexes = new Set([0, bucket.length - 1])
  const boundaryKeys = ["baseY", "endY"]

  boundaryKeys.forEach(key => {
    let minIndex = 0
    let maxIndex = 0

    for (let index = 1; index < bucket.length; index++) {
      if (bucket[index][key] < bucket[minIndex][key]) minIndex = index
      if (bucket[index][key] > bucket[maxIndex][key]) maxIndex = index
    }

    indexes.add(minIndex)
    indexes.add(maxIndex)
  })

  Array.from(indexes)
    .sort((a, b) => a - b)
    .forEach(index => target.push(bucket[index]))
}

export const reduceStackedAreaPoints = (points, width) => {
  if (!Number.isFinite(width) || width <= 0 || points.length <= width * 2) return points

  const reduced = []
  let bucket = []
  let pixel = null

  points.forEach(point => {
    if (!point || !Number.isFinite(point.x)) {
      appendBucket(reduced, bucket)
      bucket = []
      pixel = null
      if (reduced[reduced.length - 1] !== null) reduced.push(null)
      return
    }

    const nextPixel = Math.round(point.x)
    if (pixel !== null && nextPixel !== pixel) {
      appendBucket(reduced, bucket)
      bucket = []
    }

    pixel = nextPixel
    bucket.push(point)
  })

  appendBucket(reduced, bucket)
  if (reduced[reduced.length - 1] === null) reduced.pop()

  return reduced
}

const makeFillPlotter = () => plotter => {
  const { drawingContext: ctx, dygraph, points, plotArea, setName } = plotter
  const stepPlot = dygraph.getBooleanOption("stepPlot", setName)

  ctx.fillStyle = plotter.color
  ctx.globalAlpha = dygraph.getNumericOption("fillAlpha", setName)
  ctx.beginPath()

  const renderPoints = points.map(point => {
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

  reduceStackedAreaPoints(renderPoints, plotArea.w).forEach(current => {
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

const makeLinePlotter = () => plotter => {
  plotter.points.forEach(point => {
    const bounds = getDivergingStackBounds(point)
    if (bounds) point.canvasy = plotter.dygraph.toDomYCoord(bounds.end)
  })

  Dygraph.Plotters.linePlotter(plotter)
}

export default () => [makeFillPlotter(), makeLinePlotter()]
