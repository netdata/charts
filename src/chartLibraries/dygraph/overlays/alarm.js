import { trigger, getArea } from "./helpers"

const textColorMap = {
  warning: "#F9A825",
  critical: "#FF4136",
  clear: "#00AB44",
}

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { when, status } = overlays[id]

  const dygraph = chartUI.getDygraph()

  const { h } = dygraph.getArea()
  const { hidden_ctx_: ctx } = dygraph

  const area = getArea(dygraph, [when, when])

  if (!area) return trigger(chartUI, id)

  const lineWidth = 2
  const { from } = area

  trigger(chartUI, id, area)

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(from - lineWidth / 2, 0)
  ctx.lineTo(from - lineWidth / 2, h)
  ctx.globalAlpha = 1
  ctx.lineWidth = lineWidth
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = textColorMap[status]
  ctx.stroke()

  ctx.closePath()
  ctx.restore()
}
