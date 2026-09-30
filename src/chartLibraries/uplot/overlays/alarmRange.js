import { trigger, getArea } from "./helpers"
import { crisp, getStatusColor, isModern } from "./modern"

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

const drawEdge = (ctx, x, top, h) => {
  ctx.beginPath()
  ctx.moveTo(crisp(x), top)
  ctx.lineTo(crisp(x), top + h)
  ctx.stroke()
}

const drawModern = (ctx, color, { from, to, width }, top, h) => {
  ctx.save()
  ctx.globalAlpha = 0.07
  ctx.fillStyle = color
  ctx.fillRect(from, top, width, h)

  ctx.globalAlpha = 0.8
  ctx.lineWidth = 1
  ctx.setLineDash([3, 4])
  ctx.strokeStyle = color
  drawEdge(ctx, from, top, h)
  drawEdge(ctx, to, top, h)

  ctx.restore()
}

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { whenTriggered, whenLast = getNow(), status } = overlays[id]

  const u = chartUI.getUPlot()

  const { top, height: h } = chartUI.getPlotArea()
  const { ctx } = u

  const area = getArea(chartUI, [whenTriggered, whenLast])

  if (!area) return trigger(chartUI, id)

  const { from, width, to } = area
  trigger(chartUI, id, area)

  if (isModern(chartUI.chart)) {
    const color = getStatusColor(chartUI.chart, status) || textColorMap[status]
    return drawModern(ctx, color, area, top, h)
  }

  ctx.save()
  ctx.beginPath()

  ctx.rect(from, top, width, h - 1)
  ctx.fillStyle = fillColorMap[status]
  ctx.globalAlpha = 0.1
  ctx.fill()

  const borderWidth = 2
  // left border
  ctx.beginPath()
  ctx.moveTo(from, top)
  ctx.lineTo(from, top + h)
  ctx.globalAlpha = 1
  ctx.lineWidth = borderWidth
  ctx.setLineDash([4, 4])
  ctx.strokeStyle = borderColorMap[status]
  ctx.stroke()

  // right border
  ctx.beginPath()
  ctx.moveTo(to - borderWidth, top)
  ctx.lineTo(to - borderWidth, top + h)
  ctx.strokeStyle = textColorMap[status]
  ctx.stroke()

  ctx.closePath()
  ctx.restore()
}
