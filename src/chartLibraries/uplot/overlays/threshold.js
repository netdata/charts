import { crisp, getStatusColor, isModern, labelFont, roundedRectPath } from "./modern"

const bandAlpha = 0.07
const lineAlpha = 0.8
const pillFillAlpha = 0.12
const pillStrokeAlpha = 0.5
const pillHeight = 16
const pillPadding = 6
const pillInset = 4
const pillGap = 8
const minLabelSpacing = 18
const lineDash = [3, 4]

const statusLabels = { warning: "Warning", critical: "Critical" }

const isAbove = direction => direction !== "below"

const getDirection = ({ direction, warning, critical }) => {
  if (direction === "above" || direction === "below") return direction
  return Number.isFinite(warning) && Number.isFinite(critical) && critical < warning
    ? "below"
    : "above"
}

// each band runs from its threshold to the next, more severe one, or to the plot edge
export const getLevels = (overlay = {}) => {
  const direction = getDirection(overlay)
  const levels = ["warning", "critical"]
    .filter(status => Number.isFinite(overlay[status]))
    .map(status => ({ status, value: overlay[status] }))

  return levels.map((level, index) => {
    const next = levels[index + 1]
    const nextIsFurther =
      next && (isAbove(direction) ? next.value > level.value : next.value < level.value)

    return { ...level, direction, until: nextIsFurther ? next.value : null }
  })
}

export const formatThreshold = (chart, value) => {
  const dimensionId = (chart.getVisibleDimensionIds() || [])[0]
  const unitAttributes = chart.getUnitAttributesForValue(value, { dimensionId })
  return chart.getConvertedValueWithUnit(value, { dimensionId, unitAttributes })
}

// labels closer than a pill height to the previous one slide right so neither is covered
export const placeLabels = labels =>
  labels.reduce((placed, label) => {
    const previous = placed[placed.length - 1]
    const overlaps = previous && Math.abs(label.y - previous.y) < minLabelSpacing
    const shift = overlaps ? previous.shift + previous.width + pillGap : 0

    placed.push({ ...label, shift })
    return placed
  }, [])

const drawLine = (ctx, y, from, to) => {
  if (to <= from) return

  ctx.beginPath()
  ctx.moveTo(from, y)
  ctx.lineTo(to, y)
  ctx.stroke()
}

export default (chartUI, id) => {
  const { chart } = chartUI

  if (!isModern(chart)) return
  if (chart.getAttribute("chartType") === "heatmap") return

  const u = chartUI.getUPlot()
  if (!u) return

  const overlays = chart.getAttribute("overlays")
  const levels = getLevels(overlays[id])
  if (!levels.length) return

  const { left, top, width, height } = chartUI.getPlotArea()
  if (width <= 0 || height <= 0) return

  const right = left + width
  const bottom = top + height
  const clampY = y => Math.min(bottom, Math.max(top, y))
  const toY = value => top + u.valToPos(value, "y")
  const withLabels = !chart.isSparkline()
  const { ctx } = u

  ctx.save()

  levels.forEach(({ status, value, direction, until }) => {
    const color = getStatusColor(chart, status)
    const edge = isAbove(direction) ? top : bottom
    const from = clampY(toY(value))
    const to = until === null ? edge : clampY(toY(until))
    const bandTop = Math.min(from, to)
    const bandHeight = Math.abs(to - from)

    if (!bandHeight) return

    ctx.globalAlpha = bandAlpha
    ctx.fillStyle = color
    ctx.fillRect(left, bandTop, width, bandHeight)
  })

  ctx.font = labelFont

  const visible = levels
    .map(level => ({ ...level, y: toY(level.value) }))
    .filter(({ y }) => Number.isFinite(y) && y >= top && y <= bottom)
    .map(level => {
      const text = `${statusLabels[level.status]} at ${formatThreshold(chart, level.value)}`
      const textWidth = withLabels ? ctx.measureText(text).width : 0
      return { ...level, text, width: textWidth + pillPadding * 2 }
    })

  placeLabels(visible).forEach(({ status, y, text, width: pillWidth, shift }) => {
    const color = getStatusColor(chart, status)
    const lineY = crisp(y)
    const pillLeft = left + pillInset + shift
    const hasPill = withLabels && pillLeft + pillWidth <= right

    ctx.setLineDash(lineDash)
    ctx.lineWidth = 1
    ctx.strokeStyle = color
    ctx.globalAlpha = lineAlpha

    if (!hasPill) return drawLine(ctx, lineY, left, right)

    // the line stops at the pill so the label reads cleanly
    drawLine(ctx, lineY, left, pillLeft)
    drawLine(ctx, lineY, pillLeft + pillWidth, right)

    ctx.setLineDash([])
    roundedRectPath(ctx, pillLeft, lineY - pillHeight / 2, pillWidth, pillHeight, pillHeight / 2)
    ctx.globalAlpha = pillFillAlpha
    ctx.fillStyle = color
    ctx.fill()
    ctx.globalAlpha = pillStrokeAlpha
    ctx.stroke()

    ctx.globalAlpha = 1
    ctx.textAlign = "left"
    ctx.textBaseline = "middle"
    ctx.fillText(text, pillLeft + pillPadding, lineY)
  })

  ctx.restore()
}
