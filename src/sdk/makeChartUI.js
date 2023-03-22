import makeListeners from "@/helpers/makeListeners"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"

const themeIndex = {
  default: 0,
  dark: 1,
}

const getUrlOptions = () => []

const getPixelsPerPoint = () => 3

export default (sdk, chart) => {
  const listeners = makeListeners()
  let element = null
  let renderedAt = chart.getAttribute("renderedAt") || 0
  let estimatedWidth = 0
  let estimatedHeight = 0

  const mount = el => {
    element = el
    sdk.trigger("mountChartUI", chart)
  }

  const executeLatest = makeExecuteLatest()
  const latestRender = executeLatest.add(() => chart && chart.getUI() && chart.getUI().render())

  chart.on("finishFetch", latestRender)
  chart.on("visibleDimensionsChanged", latestRender)

  const unmount = () => {
    sdk.trigger("unmountChartUI", chart)
    listeners.offAll()
    element = null
  }

  const render = () => {
    renderedAt = Date.now()
  }

  const getRenderedAt = () => renderedAt

  const getElement = () => element

  const setEstimatedWidth = width => (estimatedWidth = width)

  const getEstimatedWidth = () => estimatedWidth

  const setEstimatedHeight = height => (estimatedHeight = height)

  const getEstimatedHeight = () => estimatedHeight

  const getEstimatedChartWidth = () => (element ? element.offsetWidth : estimatedWidth || 300)

  const getEstimatedChartHeight = () => (element ? element.offsetHeight : estimatedHeight || 300)

  const getThemeIndex = () => themeIndex[chart.getAttribute("theme")] || themeIndex.default

  const getThemeAttribute = name => {
    const attributes = chart.getAttributes()
    const index = getThemeIndex()
    return attributes[name]?.[index] || name
  }

  const getChartWidth = () => {
    return element ? element.offsetWidth : getEstimatedChartWidth()
  }

  const getChartHeight = () => {
    return element ? element.offsetHeight : getEstimatedChartHeight()
  }

  return {
    ...listeners,
    sdk,
    chart,
    mount,
    unmount,
    render,
    getRenderedAt,
    getElement,
    setEstimatedWidth,
    getEstimatedWidth,
    getEstimatedChartWidth,
    getChartWidth,
    getChartHeight,
    setEstimatedHeight,
    getEstimatedHeight,
    getEstimatedChartHeight,
    getPixelsPerPoint,
    getThemeIndex,
    getThemeAttribute,
    getUrlOptions,
  }
}
