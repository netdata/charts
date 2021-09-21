import { trigger, getArea } from "./helpers"

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { range } = overlays[id]

  if (!range) return

  const dygraph = chartUI.getDygraph()

  const { h } = dygraph.getArea()
  const { hidden_ctx_: ctx } = dygraph

  const area = getArea(dygraph, range)

  if (!area) return trigger(chartUI, id)

  const { from, width } = area

  trigger(chartUI, id, area)

  ctx.save()
  ctx.beginPath()

  ctx.rect(from, 0, width, h - 1)
  ctx.fillStyle = "rgba(207, 213, 218, 0.12)"
  ctx.fill()

  ctx.beginPath()
  ctx.rect(from, 0, 0, h - 1)
  ctx.rect(from + width, 0, 0, h - 1)
  ctx.fill()
  ctx.setLineDash([2, 7])
  ctx.lineWidth = 1
  ctx.strokeStyle = "#CFD5DA"
  ctx.stroke()

  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}
