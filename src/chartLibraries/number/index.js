import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"

const getUrlOptions = () => ["absolute"]

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let listeners
  let renderedValue = 0
  let resizeObserver

  const mount = element => {
    chartUI.mount(element)

    resizeObserver = makeResizeObserver(element, () => chartUI.trigger("resize"))

    const { loaded } = chart.getAttributes()

    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render)
    )

    render()
  }

  const getMinMax = value => {
    let { min, max } = chart.getPayload()
    if (min < 0 && max === 0) {
      max = -min
      min = 0
    }

    const units = chart.getUnits()
    if (units === "percentage") {
      min = 0
      max = 100
    }

    const minMax = [Math.min(min, value), Math.max(max, value)].sort((a, b) => a - b)

    return minMax[0] === minMax[1] ? [minMax[0], minMax[1] + 1] : minMax
  }

  const render = () => {
    chartUI.render()

    const { hoverX, loaded, after } = chart.getAttributes()

    if (!loaded) return

    chart.consumePayload()

    if (!hoverX && after > 0) return chartUI.trigger("rendered")

    const { result } = chart.getPayload()

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : result.data.length - 1

    const rowData = result.data[row]
    if (!Array.isArray(rowData)) return

    const [, ...rows] = rowData

    const value = rows.reduce((acc, v) => acc + v, 0)

    chartUI.render()
    const [min, max] = getMinMax(value)

    renderedValue = value

    chartUI.sdk.trigger("yAxisChange", chart, min, max)
    chartUI.trigger("rendered")
  }

  const getValue = () => renderedValue

  const unmount = () => {
    if (listeners) listeners()

    if (resizeObserver) resizeObserver()
    renderedValue = 0

    chartUI.unmount()
  }

  const instance = {
    ...chartUI,
    mount,
    unmount,
    render,
    getValue,
    getUrlOptions,
  }

  return instance
}
