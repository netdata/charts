const getHighestPoint = points => {
  let highest = points[0] || {}
  points.reduce((h, point) => {
    if (isNaN(point.canvasy)) return h

    const { yval } = point
    if (yval > h) {
      highest = point
      return yval
    }

    return h
  }, 0)

  return highest
}

export default chartUI => {
  // TODO Deprecated ???
  const getClosestArea = (event, points) => {
    const { offsetY } = event

    if (points.length === 2 && points[0].yval > 0 && points[1].yval < 0) {
      const index = chartUI.getDygraph().toDomYCoord(0) < offsetY ? 1 : 0
      return points[index].name
    }

    const validPoints = points.filter(p => !isNaN(p.canvasy))

    if (!Array.isArray(validPoints) || validPoints.length === 0) return

    if (offsetY > chartUI.getDygraph().getArea().h - 10) return "ANNOTATIONS"
    if (offsetY < 15) return "ANOMALY_RATE"

    const getY = index => {
      try {
        return index < validPoints.length
          ? validPoints[index].canvasy
          : chartUI.getDygraph().getArea().h
      } catch (e) {
        return chartUI.getDygraph().getArea().h
      }
    }

    if (offsetY < getY(0)) return getHighestPoint(validPoints).name

    if (offsetY > getY(validPoints.length - 3)) return validPoints[validPoints.length - 3]?.name // Disregard lasts

    const point = validPoints
      .slice(0, validPoints.length - 1) // Disregard ANOMALY_RATE
      .find((p, index) => getY(index) < offsetY && getY(index + 1) > offsetY)

    return point?.name
  }

  const getClosestPoint = (event, points) => {
    const { offsetY } = event

    if (offsetY > chartUI.getDygraph().getArea().h - 10) return "ANNOTATIONS"
    if (offsetY < 15) return "ANOMALY_RATE"

    const distance = p => Math.pow(offsetY - p.canvasy, 2)

    let last = distance(points[0])
    const closest = points.reduce((h, p) => {
      if (isNaN(p.canvasy)) return h

      const distancePoint = distance(p)
      if (last < distancePoint) return h

      last = distancePoint
      return p
    })

    return closest.name
  }

  const getClosestByChartType = {
    stacked: getClosestPoint,
    area: getClosestPoint,
    default: getClosestPoint,
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

  const triggerHighlight = (event, x, points, ...rest) => {
    const seriesName = points && getClosestSeries(event, points)

    if (!seriesName) return

    const seriesProps = chartUI.getDygraph().getPropertiesForSeries(seriesName)

    if (!seriesProps) return

    const dimensionIds = chartUI.chart.getPayloadDimensionIds()

    if (!dimensionIds) return
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
