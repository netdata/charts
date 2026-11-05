import makeListeners from "@/helpers/makeListeners"

export default (sdk, chart) => {
  const listeners = makeListeners()

  let element = null
  let mounted = false
  let renderedAt = chart.getDateWindow()[1]
  let uiRenderRevision = 0
  let renderedUIRevision = -1
  let renderedChartRevision = -1
  let offVisibleDimensionsChanged = null

  const getChartRenderRevision = () => chart.getRenderRevision?.() ?? 0

  const invalidateRender = () => {
    uiRenderRevision += 1
    return uiRenderRevision
  }

  const isRenderStale = () =>
    renderedUIRevision !== uiRenderRevision || renderedChartRevision !== getChartRenderRevision()

  const render = () => {
    renderedAt = chart.getDateWindow()[1]
    renderedUIRevision = uiRenderRevision
    renderedChartRevision = getChartRenderRevision()
    return true
  }

  const renderIfStale = callback => {
    if (!mounted || !isRenderStale()) return false

    const rendered = callback()
    if (rendered === false) return false

    render()
    return true
  }

  const listenForVisibleDimensions = () => {
    if (offVisibleDimensionsChanged) return
    offVisibleDimensionsChanged = chart.on("visibleDimensionsChanged", invalidateRender)
  }

  const mount = el => {
    element = el
    mounted = true
    invalidateRender()
    listenForVisibleDimensions()

    sdk.trigger("mountChartUI", chart)
    chart.trigger("mountChartUI")
  }

  const unmount = () => {
    sdk.trigger("unmountChartUI", chart)
    chart.trigger("unmountChartUI")
    listeners.offAll()
    offVisibleDimensionsChanged?.()
    offVisibleDimensionsChanged = null
    element = null
    mounted = false
    invalidateRender()
  }

  const getRenderedAt = () => renderedAt

  const getElement = () => element

  const getChartWidth = () => (element ? element.offsetWidth : 300)

  const getChartHeight = () => (element ? element.offsetHeight : 300)

  return {
    ...listeners,
    sdk,
    chart,
    mount,
    unmount,
    render,
    renderIfStale,
    invalidateRender,
    isRenderStale,
    getRenderedAt,
    getElement,
    getChartWidth,
    getChartHeight,
  }
}
