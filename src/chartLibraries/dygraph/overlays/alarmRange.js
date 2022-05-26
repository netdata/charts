import { trigger, getArea } from "./helpers"

const borderColorMap = {
  warning: "#FFF8E1",
  critical: "#FFEBEF",
  clear: "#E5F5E8",
}

const fillColorMap = {
  warning: "#FFC300",
  critical: "#F59B9B",
  clear: "#68C47D",
}

const textColorMap = {
  warning: "#F9A825",
  critical: "#FF4136",
  clear: "#00AB44",
}

const getNow = () => Math.floor(new Date().getTime() / 1000)

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { whenTriggered, whenLast = getNow(), status } = overlays[id]

  const dygraph = chartUI.getDygraph()

  const { h } = dygraph.getArea()
  const { hidden_ctx_: ctx } = dygraph

  const area = getArea(dygraph, [whenTriggered, whenLast])

  if (!area) return trigger(chartUI, id)

  const { from, width } = area
  trigger(chartUI, id, area)

  ctx.save()
  ctx.beginPath()

  ctx.rect(from, 0, width, h - 1)
  ctx.fillStyle = fillColorMap[status]
  ctx.globalAlpha = 0.1
  ctx.fill()

  // left border
  ctx.beginPath()
  ctx.moveTo(from, 0)
  ctx.lineTo(from, h)
  ctx.globalAlpha = 1
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = borderColorMap[status]
  ctx.stroke()

  // right border
  ctx.beginPath()
  ctx.moveTo(from + width, 0)
  ctx.lineTo(from + width, h)
  ctx.strokeStyle = textColorMap[status]
  ctx.stroke()

  ctx.closePath()
  ctx.restore()
}
