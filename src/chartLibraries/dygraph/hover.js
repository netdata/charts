import { removeEvent, addEvent } from "dygraphs/src/dygraph-utils"

export default chartUI => {
  const mouseout = () => {
    chartUI.sdk.trigger("blur", chartUI.chart)
    chartUI.chart.trigger("blur")
  }

  const mouseover = () => {
    chartUI.sdk.trigger("hover", chartUI.chart)
    chartUI.chart.trigger("hover")
  }

  const listeners = [chartUI.on("mouseout", mouseout), chartUI.on("mouseover", mouseover)]

  addEvent(
    chartUI.getDygraph().mouseEventElement_,
    "mousemove",
    chartUI.getDygraph().mouseMoveHandler_
  )

  const destroy = () => {
    removeEvent(
      chartUI.getDygraph().mouseEventElement_,
      "mousemove",
      chartUI.getDygraph().mouseMoveHandler_
    )
    listeners.forEach(listener => listener())
  }

  return destroy
}
