import makeListeners from "@/helpers/makeListeners"

export default (sdk, chart) => {
  const listeners = makeListeners()
  let element = null

  const mount = el => {
    element = el
    sdk.trigger("mountChartUI", chart)
  }

  const unmount = () => {
    sdk.trigger("unmountChartUI", chart)
    listeners.clearListeners()
    element = null
  }

  const getElement = () => element

  return { ...listeners, mount, unmount, getElement }
}
