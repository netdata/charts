import { removeEvent, addEvent } from "dygraphs/src/dygraph-utils"

export default chartUI => {
  let listeners = []

  const mouseout = () => {
    chartUI.sdk.trigger("blur", chartUI.chart)
    chartUI.chart.trigger("blur")
  }

  const mouseover = () => {
    chartUI.sdk.trigger("hover", chartUI.chart)
    chartUI.chart.trigger("hover")
  }

  const highlight = (event, x, points, row, seriesName) => {
    if (!seriesName) return

    const { offsetX, offsetY } = event
    const { column } = chartUI.getDygraph().getPropertiesForSeries(seriesName)
    chartUI.sdk.trigger("hoverX", chartUI.chart, offsetX, offsetY, row, column)
    chartUI.chart.trigger("hoverX", offsetX, offsetY, row, column)
  }

  const destroy = () => {
    removeEvent(
      chartUI.getDygraph().mouseEventElement_,
      "mousemove",
      chartUI.getDygraph().mouseMoveHandler_
    )
    listeners.forEach(listener => listener())
    mouseout()
  }

  const toggle = enabled => {
    destroy()

    if (!enabled) return

    addEvent(
      chartUI.getDygraph().mouseEventElement_,
      "mousemove",
      chartUI.getDygraph().mouseMoveHandler_
    )

    listeners = [
      chartUI.on("highlightCallback", highlight),
      chartUI.on("mouseout", mouseout),
      chartUI.on("mouseover", mouseover),
    ]
  }

  return { toggle, destroy }
}
