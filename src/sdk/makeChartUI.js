import makeListeners from "@/helpers/makeListeners"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"

const themeIndex = {
  default: 0,
  dark: 1,
}

const getPixelsPerPoint = () => 3

export default (sdk, chart) => {
  const listeners = makeListeners()
  let element = null
  let renderedAt = chart.getAttribute("renderedAt") || 0

  const mount = el => {
    element = el
    sdk.trigger("mountChartUI", chart)
  }

  const unmount = () => {
    sdk.trigger("unmountChartUI", chart)
    listeners.offAll()
    element = null
  }

  const render = () => renderedAt = Date.now()

  const executeLatest = makeExecuteLatest()
  const latestRender = executeLatest.add(render)

  chart.on("finishFetch", latestRender)
  chart.on("visibleDimensionsChanged", latestRender)

  const getRenderedAt = () => renderedAt

  const getElement = () => element

  const getThemeIndex = () => themeIndex[chart.getAttribute("theme")] || themeIndex.default

  const getThemeAttribute = name => {
    const attributes = chart.getAttributes()
    const index = getThemeIndex()
    return attributes[name]?.[index] || name
  }

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
    getThemeIndex,
    getThemeAttribute,
  }
}
