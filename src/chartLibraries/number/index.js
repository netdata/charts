import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let listeners
  let resizeObserver

  const mount = element => {
    chartUI.mount(element)

    resizeObserver = makeResizeObserver(element, () => chartUI.trigger("resize"))

    const { loaded } = chart.getAttributes()

    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render)
    )

    chartUI.trigger("resize")
    render()
  }

  const getMinMax = () => {
    let { getValueRange, min, max, valueRange } = chart.getAttributes()
    return getValueRange({ min, max, valueRange })
  }

  const render = () => {
    chartUI.render()

    const { hoverX, loaded, after } = chart.getAttributes()

    if (!loaded) return

    if (!hoverX && after > 0) return chartUI.trigger("rendered")

    const { data } = chart.getPayload()

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : data.length - 1

    const rowData = data[row]
    if (!Array.isArray(rowData)) return

    const [, ...rows] = rowData

    const value = rows.reduce((acc, v) => acc + v, 0)

    chartUI.render()
    const [min, max] = getMinMax()

    chartUI.sdk.trigger("yAxisChange", chart, min, max)
    chartUI.trigger("rendered")
  }

  const unmount = () => {
    if (listeners) listeners()

    if (resizeObserver) resizeObserver()

    chartUI.unmount()
  }

  const instance = {
    ...chartUI,
    mount,
    unmount,
    render,
  }

  return instance
}
