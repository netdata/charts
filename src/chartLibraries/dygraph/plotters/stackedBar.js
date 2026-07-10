import { darkenColor } from "./helpers"
import { getDivergingStackBounds } from "../divergingStack"

const getBarWidth = ({ points, plotArea }) => {
  let minSeparation = Infinity

  for (let index = 1; index < points.length; index++) {
    minSeparation = Math.min(minSeparation, points[index].canvasx - points[index - 1].canvasx)
  }

  const separation = Number.isFinite(minSeparation)
    ? minSeparation
    : plotArea.w / Math.max(points.length, 1)

  return Math.max(1, Math.floor((2 / 3) * separation))
}

export const getDivergingBarRect = (point, barWidth, toDomYCoord) => {
  const bounds = getDivergingStackBounds(point)
  if (!bounds) return null

  const baseY = toDomYCoord(bounds.base)
  const endY = toDomYCoord(bounds.end)

  return {
    x: point.canvasx - barWidth / 2,
    y: Math.min(baseY, endY),
    width: barWidth,
    height: Math.abs(baseY - endY),
  }
}

export default () => plotter => {
  const ctx = plotter.drawingContext
  const points = plotter.points
  const barWidth = getBarWidth(plotter)

  ctx.fillStyle = plotter.color
  ctx.strokeStyle = darkenColor(plotter.color)

  points.forEach(p => {
    const rect = getDivergingBarRect(p, barWidth, value =>
      plotter.dygraph.toDomYCoord(value)
    )
    if (!rect) return

    p.canvasy = plotter.dygraph.toDomYCoord(getDivergingStackBounds(p).end)

    ctx.fillRect(rect.x, rect.y, rect.width, rect.height)
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
  })
}
