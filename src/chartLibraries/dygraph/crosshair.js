export default (chartUI, row) => {
  const dygraph = chartUI.getDygraph()

  const { h } = dygraph.getArea()
  const { canvas_ctx_: ctx } = dygraph

  const rowData = chartUI.chart.getPayload().result.data[row]

  if (!Array.isArray(rowData)) return

  const x = dygraph.toDomXCoord(rowData[0])

  const themeCrosshair = chartUI.getThemeAttribute("themeCrosshair")

  ctx.save()
  ctx.beginPath()
  ctx.setLineDash([5, 5])
  ctx.strokeStyle = themeCrosshair
  ctx.moveTo(x, 0)
  ctx.lineTo(x, h)

  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}
