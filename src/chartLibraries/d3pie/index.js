import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"
import { shortForLength } from "@/helpers/shorten"
import d3pie from "./library"
import getInitialOptions from "./getInitialOptions"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let pie = null
  let listeners
  let resizeObserver
  let prevMin
  let prevMax

  const executeLatest = makeExecuteLatest()

  const reMake = () => {
    if (!pie) return

    pie.destroy()
    pie.recreate()
  }

  const mount = element => {
    if (pie) return

    chartUI.mount(element)

    const theme = chart.getAttribute("theme")
    element.classList.add(theme)

    const { loaded } = chart.getAttributes()

    pie = new d3pie(element, getInitialOptions(chartUI))

    resizeObserver = makeResizeObserver(
      element.parentNode,
      () => {
        pie.options = {
          ...pie.options,
          size: getInitialOptions(chartUI).size,
        }
        reMake()
        chartUI.trigger("resize")
      },
      () => chartUI.trigger("resize")
    )

    const latestRender = executeLatest.add(render)

    listeners = unregister(
      chart.onAttributeChange("hoverX", latestRender),
      !loaded && chart.onceAttributeChange("loaded", latestRender),
      chart.onAttributeChange("theme", latestRender),
      chart.on("visibleDimensionsChanged", latestRender)
    )

    render()
  }

  const getMinMax = () => chart.getAttribute("getValueRange")(chart)

  const render = () => {
    chartUI.render()

    const { hoverX, loaded } = chart.getAttributes()

    if (!pie || !loaded) return

    const { data } = chart.getPayload()

    let index = hoverX ? chart.getClosestRow(hoverX[0]) : -1
    index = index === -1 ? data.length - 1 : index

    const dimensionIds = chart.getVisibleDimensionIds()

    const values = dimensionIds
      .map(id => ({
        label: shortForLength(id, 30),
        value: chart.getDimensionValue(id, index),
        color: chart.selectDimensionColor(id),
        caption: id,
      }))
      .filter(v => !!v.value)

    let [min, max] = getMinMax()

    if (min !== prevMin || max !== prevMax) {
      chartUI.sdk.trigger("yAxisChange", chart, min, max)
    }

    prevMin = min
    prevMax = max

    chartUI.render()

    pie.options.data.content = values.length
      ? values
      : [
          {
            label: "No data",
            value: 1,
            color: chartUI.chart.getThemeAttribute("themeD3pieSmallColor"),
          },
        ]
    pie.options.labels = getInitialOptions(chartUI).labels

    window.requestAnimationFrame(() => {
      reMake()
    })

    chartUI.trigger("rendered")
  }

  const unmount = () => {
    if (listeners) listeners()
    if (resizeObserver) resizeObserver()

    if (pie) {
      pie.destroy()
      pie = null
    }

    prevMin = null
    prevMax = null

    chartUI.unmount()
  }

  return {
    ...chartUI,
    mount,
    unmount,
    render,
  }
}
