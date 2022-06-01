import makeListeners from "@/helpers/makeListeners"

const themeIndex = {
  default: 0,
  dark: 1,
}

const getUrlOptions = () => []

const getPixelsPerPoint = () => 3

export default (sdk, chart) => {
  const listeners = makeListeners()
  let element = null
  let renderedAt = 0
  let estimatedWidth = 0
  let parentWidth = null

  const mount = el => {
    element = el
    sdk.trigger("mountChartUI", chart)
  }

  chart.on("finishFetch", () => {
    const { active, autofetch } = chart.getAttributes()
    const consumeLatestRequestWhilePaused = active && !autofetch
    if (consumeLatestRequestWhilePaused) chart.getUI().render()
  })

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

  const getEstimatedWidth = () => estimatedWidth

  const setParentWidth = width => {
    parentWidth = width
  }

  const getParentWidth = () => parentWidth

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
    setParentWidth,
    getParentWidth,
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
