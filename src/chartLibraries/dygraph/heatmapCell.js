import { fitHeatmapGap } from "@/helpers/heatmap"

export const getHeatmapCellWidth = (g, points = []) => {
  let minSep = Infinity
  for (let i = 1; i < points.length; i++) {
    const sep = points[i].canvasx - points[i - 1].canvasx
    if (sep > 0 && sep < minSep) minSep = sep
  }

  return Number.isFinite(minSep) ? minSep : g.getArea().w
}

const snap = (value, ratio) => Math.round(value * ratio) / ratio

export default (g, points, { gap = 0, ratio = window.devicePixelRatio || 1 } = {}) => {
  const width = getHeatmapCellWidth(g, points)
  const height = Math.abs(g.toDomYCoord(1) - g.toDomYCoord(0))
  const gapX = fitHeatmapGap(width, gap)
  const gapY = fitHeatmapGap(height, gap)

  return (canvasx, yIndex) => {
    const centerY = g.toDomYCoord(yIndex)
    const left = snap(canvasx - width / 2 + gapX / 2, ratio)
    const right = snap(canvasx + width / 2 - gapX / 2, ratio)
    const top = snap(centerY - height / 2 + gapY / 2, ratio)
    const bottom = snap(centerY + height / 2 - gapY / 2, ratio)

    return { x: left, y: top, width: right - left, height: bottom - top }
  }
}

export const strokeCellInside = (ctx, { x, y, width, height }, lineWidth) => {
  ctx.lineWidth = lineWidth
  ctx.strokeRect(
    x + lineWidth / 2,
    y + lineWidth / 2,
    Math.max(0, width - lineWidth),
    Math.max(0, height - lineWidth)
  )
}
