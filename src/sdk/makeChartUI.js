import makeListeners from "@/helpers/makeListeners"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"

export default (sdk, chart) => {
  const listeners = makeListeners()
  const executeLatest = makeExecuteLatest()

  let element = null
  let renderedAt = chart.getDateWindow()[1]

  const mount = el => {
    element = el
    sdk.trigger("mountChartUI", chart)
  }

  const unmount = () => {
    sdk.trigger("unmountChartUI", chart)
    listeners.offAll()
    element = null
    if (executeLatest) executeLatest.clear()
  }

  const render = () => (renderedAt = chart.getDateWindow()[1])

  chart.on("visibleDimensionsChanged", executeLatest.add(render))

  const getRenderedAt = () => renderedAt

  const getElement = () => element

  const getChartWidth = () =>
    !chart.getAttribute("width") || chart.getAttribute("width") === "100%"
      ? element
        ? element.offsetWidth
        : 800
      : chart.getAttribute("width")

  const getChartHeight = () =>
    !chart.getAttribute("height") || chart.getAttribute("height") === "100%"
      ? element
        ? element.offsetHeight
        : 300
      : chart.getAttribute("height")

  return {
    ...listeners,
    sdk,
    chart,
    mount,
    unmount,
    render,
    getRenderedAt,
    getElement,
    getChartWidth,
    getChartHeight,
  }
}
