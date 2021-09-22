import Dygraph from "dygraphs"

export default chartUI => {
  const mousedown = (event, g, context) => {
    chartUI.sdk.trigger("panStart", chartUI.chart)
    context.initializeMouseDown(event, g, context)
    Dygraph.startPan(event, g, context)
    context.is2DPan = false
  }

  const mousemove = (event, g, context) => {
    if (!context.isPanning) return
    Dygraph.movePan(event, g, context)
  }

  const mouseup = (event, g, context) => {
    Dygraph.endPan(event, g, context)
    chartUI.sdk.trigger("panEnd", chartUI.chart, g.dateWindow_)
  }

  const mouseout = (event, g, context) => {
    if (!context.isPanning) return
    Dygraph.endPan(event, g, context)
    chartUI.sdk.trigger("panEnd", chartUI.chart, g.dateWindow_)
  }

  return chartUI
    .on("mousedown", mousedown)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup)
    .on("mouseout", mouseout)
}
