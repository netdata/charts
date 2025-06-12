import { trigger, getArea } from "./helpers"

const getTimestampPosition = (dygraph, timestamp) => {
  const [after, before] = dygraph.xAxisRange()

  const timestampMs = timestamp * 1000
  if (timestampMs < after || timestampMs > before) return null

  const x = dygraph.toDomXCoord(timestampMs)
  return { x, timestampMs }
}

const drawAnnotationLine = (ctx, x, height, color) => {
  ctx.beginPath()
  ctx.moveTo(x, 0)
  ctx.lineTo(x, height)
  ctx.lineWidth = 2
  ctx.strokeStyle = color
  ctx.stroke()
}

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const annotation = overlays[id]

  if (!annotation || annotation.type !== "annotation") return

  const { timestamp, color = "#ff6b6b", position = "top" } = annotation

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

  drawAnnotationLine(ctx, x, h, color)

  ctx.beginPath()
  ctx.arc(x, position === "top" ? 0 : h, 4, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()

  ctx.restore()
}
