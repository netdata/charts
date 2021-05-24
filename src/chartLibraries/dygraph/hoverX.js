export default chartUI => {
  const highlight = (event, x, points, row, seriesName) => {
    if (!seriesName) return

    const { offsetX, offsetY } = event
    const { column } = chartUI.getDygraph().getPropertiesForSeries(seriesName)
    chartUI.sdk.trigger("hoverX", chartUI.chart, offsetX, offsetY, row, column)
    chartUI.chart.trigger("hoverX", offsetX, offsetY, row, column)
  }

  const destroy = () => {
    chartUI.off("highlightCallback", highlight)
  }

  const toggle = enabled => {
    return enabled ? chartUI.on("highlightCallback", highlight) : destroy()
  }

  return { toggle, destroy }
}
