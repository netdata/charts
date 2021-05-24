import Dygraph from "dygraphs"

export default chartUI => {
  const mousedown = (event, g, context) => {
    chartUI.sdk.trigger("panStart", chartUI.chart)
    context.initializeMouseDown(event, g, context)
    Dygraph.startPan(event, g, context)
  }

  const mousemove = (event, g, context) => {
    if (!context.isPanning) return
    Dygraph.movePan(event, g, context)
  }

  const mouseup = (event, g, context) => {
    Dygraph.endPan(event, g, context)
    chartUI.sdk.trigger("panEnd", chartUI.chart, g.dateWindow_)
  }

  const listeners = [
    chartUI.on("mousedown", mousedown),
    chartUI.on("mousemove", mousemove),
    chartUI.on("mouseup", mouseup),
  ]

  return () => listeners.forEach(listener => listener())
}
