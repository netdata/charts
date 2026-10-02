import { trigger, getArea } from "./helpers"
import { crisp, getStatusColor, isModern } from "./modern"

const textColorMap = {
  warning: "#F9A825",
  critical: "#FF4136",
  clear: "#00AB44",
}

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { when, status } = overlays[id]

  const u = chartUI.getUPlot()

  const { top, height: h } = chartUI.getPlotArea()
  const { ctx } = u

  const area = getArea(chartUI, [when, when])

  if (!area) return trigger(chartUI, id)

  const lineWidth = 2
  const { from } = area

  trigger(chartUI, id, area)

  ctx.save()
  ctx.beginPath()

  if (isModern(chartUI.chart)) {
    ctx.moveTo(crisp(from), top)
    ctx.lineTo(crisp(from), top + h)
    ctx.globalAlpha = 0.8
    ctx.lineWidth = 1
    ctx.setLineDash([3, 4])
    ctx.strokeStyle = getStatusColor(chartUI.chart, status) || textColorMap[status]
  } else {
    ctx.moveTo(from - lineWidth / 2, top)
    ctx.lineTo(from - lineWidth / 2, top + h)
    ctx.globalAlpha = 1
    ctx.lineWidth = lineWidth
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = textColorMap[status]
  }

  ctx.stroke()

  ctx.closePath()
  ctx.restore()
}
