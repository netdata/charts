export default chartUI => {
  const findClosest = (event, points) => {
    if (!Array.isArray(points)) return

    const { offsetY } = event

    if (offsetY > chartUI.getDygraph().getArea().h - 10) return "ANNOTATIONS"
    if (offsetY < 15) return "ANOMALY_RATE"

    let closestPoint = points[0]
    let closestDistance = Math.abs(points[0].canvasy - offsetY)

    for (let i = 1; i < points.length; i++) {
      const distance = Math.abs(points[i].canvasy - offsetY)
      if (distance < closestDistance) {
        closestDistance = distance
        closestPoint = points[i]
      }
    }

    return closestPoint.name
  }

  let lastX
  let lastY
  let lastPoints
  let lastTimestamp

  const triggerHighlight = (event, x, points) => {
    const seriesName = points && findClosest(event, points)

    if (!seriesName) return

    const seriesProps = chartUI.getDygraph().getPropertiesForSeries(seriesName)

    if (!seriesProps) return

    const dimensionIds = chartUI.chart.getPayloadDimensionIds()

    if (!dimensionIds?.length) return
    const dimensionId = dimensionIds[seriesProps.column - 1] || seriesProps.name

    chartUI.sdk.trigger("highlightHover", chartUI.chart, x, dimensionId)
    chartUI.chart.trigger("highlightHover", x, dimensionId)
  }

  const highlight = (event, x, points) => {
    if (lastTimestamp === x) return

    lastPoints = points
    lastTimestamp = x

    lastX = event.offsetX
    lastY = event.offsetY

    triggerHighlight(event, x, points)
  }

  const mousemove = event => {
    if (Math.abs(event.offsetX - lastX) < 5 && Math.abs(event.offsetY - lastY) < 5) return

    lastX = event.offsetX
    lastY = event.offsetY

    triggerHighlight(event, lastTimestamp, lastPoints)
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
  }

  const toggle = enabled => {
    return enabled
      ? chartUI
          .on("highlightCallback", highlight)
          .on("mousemove", mousemove)
          .on("mouseout", mouseout)
      : destroy()
  }

  return { toggle, destroy }
}
