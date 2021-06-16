import makeListeners from "@/helpers/makeListeners"

export default (sdk, chart) => {
  const listeners = makeListeners()
  let element = null
  let renderedAt = 0

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

  return { ...listeners, sdk, chart, mount, unmount, render, getRenderedAt, getElement }
}
