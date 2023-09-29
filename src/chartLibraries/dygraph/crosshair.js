const themeAttrByFlavour = {
  hover: "themeCrosshair",
  click: "themeNetdata",
  default: "themeCrosshair",
}

const lineDashByFlavour = {
  hover: [5, 5],
  click: [2, 2],
  default: [5, 5],
}

export default (chartUI, row, flavour = "hover") => {
  const dygraph = chartUI.getDygraph()

  const { h } = dygraph.getArea()
  const { canvas_ctx_: ctx } = dygraph

  const rowData = chartUI.chart.getPayload().data[row]

  if (!Array.isArray(rowData)) return

  const x = dygraph.toDomXCoord(rowData[0])

  if (flavour === "hover") dygraph.setSelection(row)

  ctx.save()
  ctx.beginPath()
  ctx.setLineDash(lineDashByFlavour[flavour])
  ctx.strokeStyle = chartUI.chart.getThemeAttribute(themeAttrByFlavour[flavour])
  ctx.moveTo(x, 0)
  ctx.lineTo(x, h)

  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}
