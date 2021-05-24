import { removeEvent, addEvent } from "dygraphs/src/dygraph-utils"

export default chartUI => {
  let listeners = []

  const unhighlightCallback = () => {
    chartUI.sdk.trigger("blur", chartUI.chart)
    chartUI.chart.trigger("blur")
  }

  const highlightCallback = (event, x, points, row, seriesName) => {
    if (!seriesName) return

    const { offsetX, offsetY } = event
    const { column } = chartUI.getDygraph().getPropertiesForSeries(seriesName)
    chartUI.sdk.trigger("hover", chartUI.chart, offsetX, offsetY, row, column)
    chartUI.chart.trigger("hover", offsetX, offsetY, row, column)
  }

  const destroy = () => {
    removeEvent(
      chartUI.getDygraph().mouseEventElement_,
      "mousemove",
      chartUI.getDygraph().mouseMoveHandler_
    )
    listeners.forEach(listener => listener())
    unhighlightCallback()
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
      chartUI.on("highlightCallback", highlightCallback),
      chartUI.on("unhighlightCallback", unhighlightCallback),
    ]
  }

  return { toggle, destroy }
}
