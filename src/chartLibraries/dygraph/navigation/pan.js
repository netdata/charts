import Dygraph from "@netdata/dygraphs"

export default chartUI => {
  const mousedown = (event, g, context) => {
    chartUI.sdk.trigger("panStart", chartUI.chart)
    context.initializeMouseDown(event, g, context)
    Dygraph.startPan(event, g, context)
    context.is2DPan = false

    chartUI.on("mousemove", mousemove).on("mouseout", mouseup).on("mouseup", mouseup)
  }

  const mousemove = (event, g, context) => {
    if (!context.isPanning) return
    Dygraph.movePan(event, g, context)
  }

  const mouseup = (event, g, context) => {
    if (context.isPanning) {
      Dygraph.endPan(event, g, context)
      context.destroy()
      chartUI.sdk.trigger("panEnd", chartUI.chart, g.dateWindow_)
    }

    chartUI.off("mousemove", mousemove)
    chartUI.off("mouseup", mouseup)
    chartUI.off("mouseout", mouseup)
  }

  return chartUI.on("mousedown", mousedown)
}
