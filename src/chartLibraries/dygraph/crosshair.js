import { findHeatmapCell } from "@/helpers/heatmap"
import makeHeatmapCell, { strokeCellInside } from "./heatmapCell"

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

const hoverCellLineWidth = 1.5
const hoverCellLineDash = [3, 3]

export const drawCrosshairLine = (chartUI, row, flavour = "hover") => {
  const dygraph = chartUI.getDygraph()

  const { h } = dygraph.getArea()
  const { canvas_ctx_: ctx } = dygraph

  const rowData = chartUI.chart.getPayload().data[row]

  if (!Array.isArray(rowData)) return

  const x = dygraph.toDomXCoord(rowData[0])

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

export const clearInteractionLayer = chartUI => {
  const { canvas_ctx_: ctx } = chartUI.getDygraph()

  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  ctx.restore()
}

export const drawHoverCell = (chartUI, x, dimensionId) => {
  const { chart } = chartUI
  const dygraph = chartUI.getDygraph()
  const cell = findHeatmapCell(chart, x, dimensionId, () => dygraph.xAxisRange())
  if (!cell) return

  const rowData = chart.getPayload().data[cell.row]
  const { canvas_ctx_: ctx } = dygraph
  const getCell = makeHeatmapCell(dygraph, dygraph.layout_.points?.[0], {
    gap: chart.getAttribute("heatmapCellGap"),
  })
  ctx.save()
  ctx.setLineDash(hoverCellLineDash)
  ctx.strokeStyle =
    chart.getAttribute("heatmapHoverColor") || chart.getThemeAttribute("themeCrosshair")
  strokeCellInside(ctx, getCell(dygraph.toDomXCoord(rowData[0]), cell.yIndex), hoverCellLineWidth)
  ctx.restore()
}

export default (chartUI, row, flavour = "hover") => {
  const rowData = chartUI.chart.getPayload().data[row]

  if (!Array.isArray(rowData)) return

  chartUI.getDygraph().setSelection(row)
  drawCrosshairLine(chartUI, row, flavour)
}
