export default chartUI => {
  const mousedown = () => {
    if (chartUI.chart.onSelectVerticalAndZoom()) return
    if (chartUI.chart.onHighlight()) return
    if (chartUI.chart.onSelectAndZoom()) return
  }

  const mouseup = () => {
    setTimeout(() => {
      const navigation = chartUI.chart.getAttribute("prevNavigation")
      if (navigation) chartUI.chart.updateAttributes({ navigation, prevNavigation: null })
    })
  }

  const wheel = (event, g) => {
    if (!event.shiftKey && !event.altKey) return
    event.preventDefault()
    event.stopPropagation()

    const zoom = (g, zoomInPercentage, bias) => {
      bias = bias || 0.5
      const [afterAxis, beforeAxis] = g.xAxisRange()
      const delta = afterAxis - beforeAxis
      const increment = delta * zoomInPercentage
      const [afterIncrement, beforeIncrement] = [increment * bias, increment * (1 - bias)]

      const after = Math.round(afterAxis + afterIncrement) / 1000
      const before = Math.round(beforeAxis - beforeIncrement) / 1000

      chartUI.sdk.trigger("moveX", chartUI.chart, after, before)
    }

    const offsetToPercentage = (g, offsetX) => {
      const xOffset = g.toDomCoords(g.xAxisRange()[0], null)[0]

      const x = offsetX - xOffset

      const w = g.toDomCoords(g.xAxisRange()[1], null)[0] - xOffset

      // Percentage from the left.
      return w == 0 ? 0 : x / w
    }

    const normal = event.detail ? event.detail * -1 : event.deltaY * 2
    const percentage = normal / 50

    if (!event.offsetX) event.offsetX = event.layerX - event.target.offsetLeft
    const xPct = offsetToPercentage(g, event.offsetX)

    zoom(g, percentage, xPct)
  }

  return chartUI.on("mousedown", mousedown).on("mouseup", mouseup).on("wheel", wheel)
}
