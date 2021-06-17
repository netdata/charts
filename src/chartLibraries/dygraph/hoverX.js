export default chartUI => {
  const highlight = (event, x, points, row, seriesName) => {
    if (!seriesName) return

    const { offsetX, offsetY } = event
    const { column } = chartUI.getDygraph().getPropertiesForSeries(seriesName)
    const { dimensionIds } = chartUI.chart.getPayload()
    const dimensionId = dimensionIds[column - 1]

    chartUI.sdk.trigger("hoverX", chartUI.chart, offsetX, offsetY, row, dimensionId)
    chartUI.chart.trigger("hoverX", offsetX, offsetY, row, dimensionId)
  }

  const destroy = () => {
    chartUI.off("highlightCallback", highlight)
  }

  const toggle = enabled => {
    return enabled ? chartUI.on("highlightCallback", highlight) : destroy()
  }

  return { toggle, destroy }
}
