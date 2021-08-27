import makeListeners from "@/helpers/makeListeners"

const themeIndex = {
  default: 0,
  dark: 1,
}

const getUrlOptions = () => []

const getPixelsPerPoint = () => 1

export default (sdk, chart) => {
  const listeners = makeListeners()
  let element = null
  let renderedAt = 0
  let estimatedWidth = 0

  const mount = el => {
    element = el
    sdk.trigger("mountChartUI", chart)
  }

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

  const setEstimatedWidth = width => {
    estimatedWidth = width
  }

  const getEstimatedWidth = width => {
    estimatedWidth = width
  }

  const getEstimatedChartWidth = () => {
    return element ? element.offsetWidth : estimatedWidth || 300
  }

  const getThemeIndex = () => themeIndex[chart.getAttribute("theme")] || themeIndex.default

  const getThemeAttribute = name => {
    const attributes = chart.getAttributes()
    const index = getThemeIndex()
    return attributes[name][index]
  }

  const getChartWidth = () => {
    return element ? element.offsetWidth : getEstimatedChartWidth()
  }

  const getChartHeight = () => {
    return element ? element.offsetHeight : getEstimatedChartWidth()
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
    getPixelsPerPoint,
    getThemeIndex,
    getThemeAttribute,
    getUrlOptions,
    format: "json",
  }
}
