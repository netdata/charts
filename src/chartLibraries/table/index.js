import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let listeners
  let resizeObserver
  let prevMin
  let prevMax

  const mount = element => {
    chartUI.mount(element)

    resizeObserver = makeResizeObserver(
      element,
      () => chartUI.trigger("resize"),
      () => chartUI.trigger("resize")
    )

    const { loaded } = chart.getAttributes()

    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render)
    )

    render()
  }

  const render = () => {
    chartUI.render()

    const { hoverX, loaded } = chart.getAttributes()

    if (!loaded) return

    const { data } = chart.getPayload()

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : data.length - 1

    const rowData = data[row]
    if (!Array.isArray(rowData)) return

    chartUI.render()
    const min = chart.getAttribute("min")
    const max = chart.getAttribute("max")

    if (min !== prevMin || max !== prevMax) {
      chartUI.sdk.trigger("yAxisChange", chart, min, max)
    }

    prevMin = min
    prevMax = max

    chartUI.trigger("rendered")
  }

  const unmount = () => {
    if (listeners) listeners()

    if (resizeObserver) resizeObserver()

    chartUI.unmount()
    prevMin = null
    prevMax = null
  }

  const instance = {
    ...chartUI,
    mount,
    unmount,
    render,
  }

  return instance
}
