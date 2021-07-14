export default chartUI => {
  const getClosestSeries = (event, points) => {
    const distance = p => Math.pow(event.offsetY - p.canvasy, 2)

    let last = distance(points[0])
    const closest = points.reduce((a, b) => {
      const distanceB = distance(b)
      if (last < distanceB) return a

      last = distanceB
      return b
    })

    return closest.name
  }

  let lastX
  let lastY
  let lastPoints
  let lastTimestamp

  const triggerHighlight = (event, x, points) => {
    const seriesName = getClosestSeries(event, points)

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
