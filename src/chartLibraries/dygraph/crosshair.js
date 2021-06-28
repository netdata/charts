export default (chartUI, row) => {
  const dygraph = chartUI.getDygraph()

  const { h } = dygraph.getArea()
  const { canvas_ctx_: ctx } = dygraph

  const x = dygraph.toDomXCoord(chartUI.chart.getPayload().result.data[row][0])

  ctx.save()
  ctx.beginPath()
  ctx.setLineDash([5, 5])
  ctx.strokeStyle = "rgb(83,103,117,0.3)"
  ctx.moveTo(x, 0)
  ctx.lineTo(x, h)

  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}
