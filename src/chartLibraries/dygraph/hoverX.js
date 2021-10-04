export default chartUI => {
  const getClosestArea = (event, points) => {
    const { offsetY } = event

    if (points.length === 2 && points[0].yval > 0 && points[1].yval < 0) {
      const index = chartUI.getDygraph().toDomYCoord(0) < offsetY ? 1 : 0
      return points[index].name
    }

    const validPoints = points.filter(p => !isNaN(p.canvasy))

    const getY = index => {
      if (index < validPoints.length) return validPoints[index].canvasy
      return chartUI.getDygraph().getArea().h
    }

    if (offsetY < getY(0)) return validPoints[0].name
    if (offsetY > getY(validPoints.length - 1)) return validPoints[validPoints.length - 1].name

    const point = validPoints.find((p, index) => getY(index) < offsetY && getY(index + 1) > offsetY)

    return point.name
  }

  const getClosestPoint = (event, points) => {
    const { offsetY } = event
    const distance = p => Math.pow(offsetY - p.canvasy, 2)

    let last = distance(points[0])
    const closest = points.reduce((a, b) => {
      const distanceB = distance(b)
      if (last < distanceB) return a

      last = distanceB
      return b
    })

    return closest.name
  }

  const getClosestSeries = (event, points) => {
    const chartType =
      chartUI.chart.getAttribute("chartType") || chartUI.chart.getMetadata().chartType

    if (chartType === "stacked" || chartType === "area") return getClosestArea(event, points)

    return getClosestPoint(event, points)
  }

  let lastX
  let lastY
  let lastPoints
  let lastTimestamp

  const triggerHighlight = (event, x, points) => {
    const seriesName = points && getClosestSeries(event, points)

    if (!seriesName) return

    // const { offsetX, offsetY } = event
    const { column } = chartUI.getDygraph().getPropertiesForSeries(seriesName)
    const { dimensionIds } = chartUI.chart.getPayload()
    const dimensionId = dimensionIds[column - 1]

    chartUI.sdk.trigger("highlightHover", chartUI.chart, x, dimensionId)
    chartUI.chart.trigger("highlightHover", x, dimensionId)
  }

  const highlight = (event, x, points) => {
    if (lastTimestamp === x) return

    lastPoints = points
    lastTimestamp = x

    lastY = event.offsetY

    triggerHighlight(event, x, points)
  }

  const mousemove = event => {
    if (Math.abs(event.offsetX - lastX) < 5 && Math.abs(event.offsetY - lastY) < 5) return

    lastX = event.offsetX
    lastY = event.offsetY

    triggerHighlight(event, lastTimestamp, lastPoints)
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
      ? chartUI.on("highlightCallback", highlight).on("mousemove", mousemove)
      : destroy()
  }

  return { toggle, destroy }
}
