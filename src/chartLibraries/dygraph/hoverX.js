export default chartUI => {
  const getClosestArea = (event, points) => {
    const { offsetY } = event

    if (points.length === 2 && points[0].yval > 0 && points[1].yval < 0) {
      const index = chartUI.getDygraph().toDomYCoord(0) < offsetY ? 1 : 0
      return points[index].name
    }

    if (offsetY > chartUI.getDygraph().getArea().h - 10) return "ANNOTATIONS"
    if (offsetY < 15) return "ANOMALY_RATE"

    const getY = point => {
      try {
        return isNaN(point.canvasy) ? chartUI.getDygraph().getArea().h : point.canvasy
      } catch (e) {
        return chartUI.getDygraph().getArea().h
      }
    }

    const point = points.slice(0, points.length - 2).reduce((h, p) => {
      const pointY = getY(p)
      if (pointY > offsetY) return h

      return !h || getY(h) < pointY ? p : h
    }, points[0])

    return point?.name
  }

  const getClosestPoint = (event, points) => {
    const { offsetY } = event

    if (offsetY > chartUI.getDygraph().getArea().h - 10) return "ANNOTATIONS"
    if (offsetY < 15) return "ANOMALY_RATE"

    const distance = p =>
      Math.pow(offsetY - (isNaN(p.canvasy) ? chartUI.getDygraph().getArea().h : p.canvasy), 2)

    let last = distance(points[0])
    const closest = points.reduce((h, p) => {
      const distancePoint = distance(p)
      if (last < distancePoint) return h

      last = distancePoint
      return p
    }, points[0])

    return closest.name
  }

  const getClosestRow = (event, points) => {
    const { offsetY } = event

    if (offsetY > chartUI.getDygraph().getArea().h - 10) return "ANNOTATIONS"
    if (offsetY < 15) return "ANOMALY_RATE"

    const dimensionIds = chartUI.chart.getVisibleDimensionIds()

    let selectedOffset = null
    return points.slice(0, points.length - 2).reduce((h, p) => {
      const index = dimensionIds.findIndex(id => id === p.name)
      const canvasy = chartUI.getDygraph().toDomYCoord(index)
      if (canvasy > offsetY) return h
      if (selectedOffset && canvasy < selectedOffset) return h

      selectedOffset = canvasy
      return p.name
    }, points[0])
  }

  const getClosestByChartType = {
    heatmap: getClosestRow,
    default: getClosestArea,
  }

  const getClosestSeries = (event, points) => {
    if (!Array.isArray(points)) return

    const chartType = chartUI.chart.getAttribute("chartType")
    const getClosest = getClosestByChartType[chartType] || getClosestByChartType.default

    return getClosest(event, points)
  }

  let lastX
  let lastY
  let lastPoints
  let lastTimestamp

  const triggerHighlight = (event, x, points) => {
    const seriesName = points && getClosestSeries(event, points)

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
