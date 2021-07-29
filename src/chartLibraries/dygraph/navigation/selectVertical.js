import Dygraph from "dygraphs"

export default chartUI => {
  let startY
  let endY

  const mousedown = (event, g, context) => {
    chartUI.sdk.trigger("highlightVerticalStart", chartUI.chart)
    context.initializeMouseDown(event, g, context)
    Dygraph.startZoom(event, g, context)
    startY = context.dragStartY
    endY = -1
  }

  const mousemove = (event, g, context) => {
    if (!context.isZooming) return

    const { dragEndY } = context
    endY = dragEndY
    Dygraph.moveZoom(event, g, context)
  }

  const getRange = () => {
    if (endY === -1 || Math.abs(startY - endY) < 5) return null

    if (endY > startY) return [startY, endY]

    return [endY, startY]
  }

  const mouseup = (event, g, context) => {
    g.clearZoomRect_()
    Dygraph.endZoom(event, g, context)
    context.isZooming = false
    context.dragStartY = null

    const range = getRange()

    chartUI.sdk.trigger("highlightVerticalEnd", chartUI.chart, range)
  }

  const listeners = [
    chartUI.on("mousedown", mousedown),
    chartUI.on("mousemove", mousemove),
    chartUI.on("mouseup", mouseup),
  ]

  return () => listeners.forEach(listener => listener())
}
