import { trigger, getArea } from "./helpers"

const borderColorMap = {
  warning: "#FFC300",
  critical: "#F59B9B",
  clear: "#68C47D",
}

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { when, status } = overlays[id]

  const dygraph = chartUI.getDygraph()

  const { h } = dygraph.getArea()
  const { hidden_ctx_: ctx } = dygraph

  const area = getArea(dygraph, [when, when])

  if (!area) return trigger(chartUI, id)

  const horizontalPadding = 3
  const from = area.from - horizontalPadding
  const width = 2 * horizontalPadding

  trigger(chartUI, id, area)

  ctx.save()
  ctx.beginPath()

  ctx.rect(from, 0, width, h - 1)
  ctx.fillStyle = borderColorMap[status]
  ctx.globalAlpha = 0.4
  ctx.fill()
  ctx.setLineDash([2, 4])
  ctx.lineWidth = 1
  ctx.strokeStyle = "#CFD5DA"

  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}
