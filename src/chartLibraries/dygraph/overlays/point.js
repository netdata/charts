import crosshair from "../crosshair"

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { row } = overlays[id]

  crosshair(chartUI, row, "click")
}
