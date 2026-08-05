const hoverDotRadius = 4
const sparklineHoverDotRadius = 3

const drawMarkers = (chartUI, u, x, row) => {
  const { chart } = chartUI

  if (chart.getAttribute("chartType") === "heatmap") return
  if (!Number.isFinite(x)) return

  const { top } = chartUI.getPlotArea()
  const radius = chart.isSparkline() ? sparklineHoverDotRadius : hoverDotRadius
  const dimensionIds = chart.getPayloadDimensionIds()
  const { ctx } = u

  ctx.save()

  dimensionIds.forEach((id, index) => {
    if (!chart.isDimensionVisible(id)) return

    const series = u.data[index + 1]
    const value = series && series[row]
    if (value == null) return

    const y = top + u.valToPos(value, "y")
    if (!Number.isFinite(y)) return

    ctx.beginPath()
    ctx.fillStyle = chart.selectDimensionColor(id)
    ctx.arc(x, y, radius, 0, 2 * Math.PI)
    ctx.fill()
  })

  ctx.restore()
}

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { row } = overlays[id]

  const rowData = chartUI.chart.getPayload().data[row]

  if (!Array.isArray(rowData)) return

  const u = chartUI.getUPlot()
  if (!u) return

  const { top, height: h } = chartUI.getPlotArea()
  const { ctx } = u

  const x = chartUI.getXCoord(rowData[0])

  ctx.save()
  ctx.beginPath()
  ctx.setLineDash([2, 2])
  ctx.strokeStyle = chartUI.chart.getThemeAttribute("themeNetdata")
  ctx.moveTo(x, top)
  ctx.lineTo(x, top + h)

  ctx.stroke()
  ctx.closePath()
  ctx.restore()

  drawMarkers(chartUI, u, x, row)
}
