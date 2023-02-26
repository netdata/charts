import { removeEvent, addEvent } from "dygraphs/src/dygraph-utils"

export default chartUI => {
  const mouseout = event => {
    chartUI.sdk.trigger("blurChart", chartUI.chart, event)
    chartUI.chart.trigger("blurChart", event)
  }

  const mouseover = event => {
    chartUI.sdk.trigger("hoverChart", chartUI.chart, event)
    chartUI.chart.trigger("hoverChart", event)
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
