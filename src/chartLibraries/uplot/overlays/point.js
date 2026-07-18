export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { row } = overlays[id]

  const rowData = chartUI.chart.getPayload().data[row]

  if (!Array.isArray(rowData)) return

  const u = chartUI.getUPlot()
  if (!u) return

  const { height: h } = chartUI.getPlotArea()
  const { ctx } = u

  const x = chartUI.getXCoord(rowData[0])

  ctx.save()
  ctx.beginPath()
  ctx.setLineDash([2, 2])
  ctx.strokeStyle = chartUI.chart.getThemeAttribute("themeNetdata")
  ctx.moveTo(x, 0)
  ctx.lineTo(x, h)

  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}
