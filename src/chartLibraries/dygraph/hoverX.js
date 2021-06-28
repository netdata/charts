export default chartUI => {
  const highlight = (event, x, points, row, seriesName) => {
    if (!seriesName) return

    // const { offsetX, offsetY } = event
    const { column } = chartUI.getDygraph().getPropertiesForSeries(seriesName)
    const { dimensionIds } = chartUI.chart.getPayload()
    const dimensionId = dimensionIds[column - 1]

    chartUI.sdk.trigger("highlightHover", chartUI.chart, x, dimensionId)
    chartUI.chart.trigger("highlightHover", x, dimensionId)
  }

  const destroy = () => {
    chartUI.off("highlightCallback", highlight)
  }

  const toggle = enabled => {
    return enabled ? chartUI.on("highlightCallback", highlight) : destroy()
  }

  return { toggle, destroy }
}
