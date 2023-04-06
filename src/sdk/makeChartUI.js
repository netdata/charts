import makeListeners from "@/helpers/makeListeners"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"

const getPixelsPerPoint = () => 3

export default (sdk, chart) => {
  const listeners = makeListeners()
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
  }

  const render = () => (renderedAt = chart.getDateWindow()[1])

  const executeLatest = makeExecuteLatest()
  const latestRender = executeLatest.add(render)

  chart.on("finishFetch", latestRender)
  chart.on("visibleDimensionsChanged", latestRender)

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
    getPixelsPerPoint,
  }
}
