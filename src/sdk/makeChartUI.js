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

  const getChartWidth = () => (element ? element.offsetWidth : 800)

  const getChartHeight = () => (element ? element.offsetHeight : 300)

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
