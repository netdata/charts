import { trigger, getArea } from "./helpers"

const getTimestampPosition = (dygraph, timestamp) => {
  const [after, before] = dygraph.xAxisRange()

  const timestampMs = timestamp * 1000
  if (timestampMs < after || timestampMs > before) return null

  const x = dygraph.toDomXCoord(timestampMs)
  return { x, timestampMs }
}

const drawAnnotationLine = (ctx, x, height, color, isDraft = false, isSynced = false) => {
  ctx.beginPath()
  if (isDraft || isSynced) ctx.setLineDash([5, 5])
  ctx.moveTo(x, 0)
  ctx.lineTo(x, height)
  ctx.lineWidth = 1
  ctx.strokeStyle = color
  ctx.globalAlpha = isSynced ? 0.7 : 1
  ctx.stroke()
  ctx.globalAlpha = 1
  if (isDraft || isSynced) ctx.setLineDash([])
}

export default (chartUI, id) => {
  const draftAnnotation = chartUI.chart.getAttribute("draftAnnotation")

  if (id === "draftAnnotation" && draftAnnotation) {
    const { timestamp } = draftAnnotation
    const color = "#888888"

    if (!timestamp) return

    const dygraph = chartUI.getDygraph()
    const { h } = dygraph.getArea()
    const { hidden_ctx_: ctx } = dygraph

    const pos = getTimestampPosition(dygraph, timestamp)
    if (!pos) return

    const { x } = pos
    const area = { from: x, to: x, width: 0 }

    trigger(chartUI, id, area)

    ctx.save()
    drawAnnotationLine(ctx, x, h, color, true)

    ctx.beginPath()
    ctx.arc(x, 0, 2, 0, 1 * Math.PI)
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

  const dygraph = chartUI.getDygraph()
  const { h } = dygraph.getArea()
  const { hidden_ctx_: ctx } = dygraph

  const pos = getTimestampPosition(dygraph, timestamp)
  if (!pos) return trigger(chartUI, id)

  const area = getArea(dygraph, [timestamp, timestamp])

  if (!area) return trigger(chartUI, id)

  trigger(chartUI, id, area)

  const { x } = pos

  ctx.save()

  drawAnnotationLine(ctx, x, h, color, false, isSynced)

  ctx.beginPath()
  ctx.arc(x, position === "top" ? 0 : h, 2, 0, 1 * Math.PI)
  ctx.fillStyle = color
  ctx.globalAlpha = isSynced ? 0.7 : 1
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.restore()
}
