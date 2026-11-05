import { trigger, getArea } from "./helpers"
import { crisp, isModern } from "./modern"

const getTimestampPosition = (chartUI, timestamp) => {
  const range = chartUI.getXAxisRange()
  if (!range) return null

  const [after, before] = range
  const timestampMs = timestamp * 1000
  if (timestampMs < after || timestampMs > before) return null

  const x = chartUI.getXCoord(timestampMs)
  return { x, timestampMs }
}

const drawAnnotationLine = (ctx, x, top, bottom, color, isDraft = false, isSynced = false) => {
  ctx.beginPath()
  if (isDraft || isSynced) ctx.setLineDash([5, 5])
  ctx.moveTo(x, top)
  ctx.lineTo(x, bottom)
  ctx.lineWidth = 1
  ctx.strokeStyle = color
  ctx.globalAlpha = isSynced ? 0.7 : 1
  ctx.stroke()
  ctx.globalAlpha = 1
  if (isDraft || isSynced) ctx.setLineDash([])
}

const flagWidth = 7
const flagHeight = 7

const drawFlag = (ctx, x, top, color, hollow) => {
  ctx.beginPath()
  ctx.moveTo(x, top)
  ctx.lineTo(x + flagWidth, top + flagHeight / 2)
  ctx.lineTo(x, top + flagHeight)
  ctx.closePath()

  if (!hollow) {
    ctx.fillStyle = color
    ctx.fill()
    return
  }

  ctx.lineWidth = 1
  ctx.strokeStyle = color
  ctx.stroke()
}

const drawModernAnnotation = (
  ctx,
  x,
  top,
  bottom,
  color,
  { isDraft = false, isSynced = false }
) => {
  const lineX = crisp(x)

  ctx.beginPath()
  if (isDraft || isSynced) ctx.setLineDash([3, 3])
  ctx.moveTo(lineX, top)
  ctx.lineTo(lineX, bottom)
  ctx.lineWidth = 1
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.5
  ctx.stroke()
  ctx.setLineDash([])

  ctx.globalAlpha = isSynced ? 0.7 : 1
  drawFlag(ctx, lineX - 0.5, top, color, isDraft)
  ctx.globalAlpha = 1
}

const isModernSparkline = chart => isModern(chart) && chart.isSparkline()

export default (chartUI, id) => {
  const draftAnnotation = chartUI.chart.getAttribute("draftAnnotation")

  if (id === "draftAnnotation" && draftAnnotation) {
    const { timestamp } = draftAnnotation
    const color = "#888888"

    if (!timestamp) return

    const u = chartUI.getUPlot()
    if (!u) return

    const { top, height: h } = chartUI.getPlotArea()
    const { ctx } = u

    const pos = getTimestampPosition(chartUI, timestamp)
    if (!pos) return

    const { x } = pos
    const area = { from: x, to: x, width: 0 }

    trigger(chartUI, id, area)

    if (isModernSparkline(chartUI.chart)) return

    ctx.save()

    if (isModern(chartUI.chart)) {
      const modernColor = chartUI.chart.getThemeAttribute("themeAxisLabelColor")
      drawModernAnnotation(ctx, x, top, top + h, modernColor, { isDraft: true })
      ctx.restore()
      return
    }

    drawAnnotationLine(ctx, x, top, top + h, color, true)

    ctx.beginPath()
    ctx.arc(x, top, 2, 0, 1 * Math.PI)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.restore()
    return
  }

  const overlays = chartUI.chart.getAttribute("overlays")
  const annotation = overlays[id]

  if (!annotation || annotation.type !== "annotation") return

  const { timestamp, color = "#ff6b6b", position = "top", originallyFrom } = annotation
  const isSynced = !!originallyFrom

  if (!timestamp) return

  const u = chartUI.getUPlot()
  if (!u) return

  const { top, height: h } = chartUI.getPlotArea()
  const { ctx } = u

  const pos = getTimestampPosition(chartUI, timestamp)
  if (!pos) return trigger(chartUI, id)

  const area = getArea(chartUI, [timestamp, timestamp])

  if (!area) return trigger(chartUI, id)

  trigger(chartUI, id, area)

  if (isModernSparkline(chartUI.chart)) return

  const { x } = pos

  ctx.save()

  if (isModern(chartUI.chart)) {
    drawModernAnnotation(ctx, x, top, top + h, color, { isSynced })
    ctx.restore()
    return
  }

  drawAnnotationLine(ctx, x, top, top + h, color, false, isSynced)

  ctx.beginPath()
  ctx.arc(x, position === "top" ? top : top + h, 2, 0, 1 * Math.PI)
  ctx.fillStyle = color
  ctx.globalAlpha = isSynced ? 0.7 : 1
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.restore()
}
