export default chartUI => {
  const findClosest = (event, points) => {
    if (!Array.isArray(points)) return {}

    const { offsetY } = event

    if (offsetY > chartUI.getDygraph().getArea().h - 10) return { seriesName: "ANNOTATIONS" }
    if (offsetY < 15) return { seriesName: "ANOMALY_RATE" }

    if (chartUI.chart.getAttribute("chartType"))
      return chartUI.getDygraph().findStackedPoint(event.offsetX, event.offsetY)

    return chartUI.getDygraph().findClosestPoint(event.offsetX, event.offsetY)
  }

  let lastX
  let lastY
  let lastPoints
  let lastTimestamp

  const getDimension = (event, points) => {
    const { seriesName } = findClosest(event, points)

    if (!seriesName) return

    const seriesProps = chartUI.getDygraph().getPropertiesForSeries(seriesName)

    if (!seriesProps) return

    const dimensionIds = chartUI.chart.getPayloadDimensionIds()

    if (!dimensionIds?.length) return
    return dimensionIds[seriesProps.column - 1] || seriesProps.name
  }

  const highlight = (event, x, points) => {
    if (lastTimestamp === x) return

    lastPoints = points
    lastTimestamp = x

    lastX = event.offsetX
    lastY = event.offsetY

    const dimensionId = getDimension(event, points)

    if (!dimensionId) return

    chartUI.sdk.trigger("highlightHover", chartUI.chart, x, dimensionId)
    chartUI.chart.trigger("highlightHover", x, dimensionId)
  }

  const persistedHighlight = (event, x, points) => {
    if (lastTimestamp === x) return

    lastPoints = points
    lastTimestamp = x

    lastX = event.offsetX
    lastY = event.offsetY

    const dimensionId = getDimension(event, points)

    chartUI.sdk.trigger("highlightClick", chartUI.chart, x, dimensionId)
    chartUI.chart.trigger("highlightClick", x, dimensionId)
  }

  const mousemove = event => {
    if (Math.abs(event.offsetX - lastX) < 5 && Math.abs(event.offsetY - lastY) < 5) return

    lastX = event.offsetX
    lastY = event.offsetY

    const dimensionId = getDimension(event, lastPoints)

    if (!dimensionId) return

    chartUI.sdk.trigger("highlightHover", chartUI.chart, lastTimestamp, dimensionId)
    chartUI.chart.trigger("highlightHover", lastTimestamp, dimensionId)
  }

  const mouseout = () => {
    chartUI.sdk.trigger("highlightBlur", chartUI.chart)
    chartUI.chart.trigger("highlightBlur")
  }

  const destroy = () => {
    lastY = null
    lastPoints = null
    lastTimestamp = null

    chartUI.off("highlightCallback", highlight)
    chartUI.off("mousemove", mousemove)
    chartUI.off("mouseout", mouseout)
    chartUI.off("click", persistedHighlight)
  }

  const toggle = enabled => {
    return enabled
      ? chartUI
          .on("highlightCallback", highlight)
          .on("mousemove", mousemove)
          .on("mouseout", mouseout)
          .on("click", persistedHighlight)
      : destroy()
  }

  return { toggle, destroy }
}
