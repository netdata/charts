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

// shared by the band pass (under the series) and the label pass (over them), so both agree
const getLayout = (chartUI, id) => {
  const { chart } = chartUI

  if (!isModern(chart)) return null
  if (chart.isSparkline()) return null
  if (chart.getAttribute("chartType") === "heatmap") return null

  const u = chartUI.getUPlot()
  if (!u) return null

  const overlays = chart.getAttribute("overlays")
  const levels = getLevels(overlays[id])
  if (!levels.length) return null

  const { left, top, width, height } = chartUI.getPlotArea()
  if (width <= 0 || height <= 0) return null

  const right = left + width
  const bottom = top + height
  const toY = value => top + u.valToPos(value, "y")
  const { ctx } = u

  ctx.save()
  ctx.font = labelFont

  const visible = levels
    .map(level => ({ ...level, y: toY(level.value) }))
    .filter(({ y }) => Number.isFinite(y) && y >= top && y <= bottom)
    .map(level => {
      const text = `${statusLabels[level.status]} at ${formatThreshold(chart, level.value)}`
      return { ...level, text, width: ctx.measureText(text).width + pillPadding * 2 }
    })

  ctx.restore()

  const labels = placeLabels(visible).map(label => {
    const pillLeft = left + pillInset + label.shift
    return { ...label, lineY: crisp(label.y), pillLeft, hasPill: pillLeft + label.width <= right }
  })

  return { chart, ctx, levels, labels, left, right, top, bottom, width, toY }
}

export default (chartUI, id) => {
  const layout = getLayout(chartUI, id)
  if (!layout) return

  const { chart, ctx, levels, labels, left, right, top, bottom, width, toY } = layout
  const clampY = y => Math.min(bottom, Math.max(top, y))

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

  labels.forEach(({ status, lineY, width: pillWidth, pillLeft, hasPill }) => {
    ctx.setLineDash(lineDash)
    ctx.lineWidth = 1
    ctx.strokeStyle = getStatusColor(chart, status)
    ctx.globalAlpha = lineAlpha

    if (!hasPill) return drawLine(ctx, lineY, left, right)

    drawLine(ctx, lineY, left, pillLeft)
    drawLine(ctx, lineY, pillLeft + pillWidth, right)
  })

  ctx.restore()
}

// drawn after the series: an opaque pill keeps the label clear of every line, band and series
export const drawLabels = (chartUI, id) => {
  const layout = getLayout(chartUI, id)
  if (!layout) return

  const { chart, ctx, labels } = layout
  const background = chart.getThemeAttribute("themeBackground")

  ctx.save()
  ctx.font = labelFont
  ctx.setLineDash([])
  ctx.lineWidth = 1
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"

  labels.forEach(({ status, lineY, text, width: pillWidth, pillLeft, hasPill }) => {
    if (!hasPill) return

    const color = getStatusColor(chart, status)

    roundedRectPath(ctx, pillLeft, lineY - pillHeight / 2, pillWidth, pillHeight, pillHeight / 2)
    ctx.globalAlpha = 1
    ctx.fillStyle = background
    ctx.fill()
    ctx.globalAlpha = pillFillAlpha
    ctx.fillStyle = color
    ctx.fill()
    ctx.globalAlpha = pillStrokeAlpha
    ctx.strokeStyle = color
    ctx.stroke()

    ctx.globalAlpha = 1
    ctx.fillText(text, pillLeft + pillPadding, lineY)
  })

  ctx.restore()
}
