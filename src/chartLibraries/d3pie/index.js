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
  let modern = false

  const executeLatest = makeExecuteLatest()

  const reMake = () => {
    if (!pie) return

    pie.destroy()
    pie.recreate()
  }

  const mount = element => {
    if (pie || modern) return

    chartUI.mount(element)

    const { loaded } = chart.getAttributes()

    // The modern donut is drawn by React inside this element; the instance only drives renders.
    modern = chart.getAttribute("designFlavour") === "modern"

    if (modern) {
      resizeObserver = makeResizeObserver(
        element.parentNode,
        () => chartUI.trigger("resize"),
        () => chartUI.trigger("resize")
      )
    } else {
      const theme = chart.getAttribute("theme")
      element.classList.add(theme)

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
    }

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

  const triggerValueRange = () => {
    const [min, max] = getMinMax()

    if (min !== prevMin || max !== prevMax) {
      chart.trigger("yAxisChange", min, max)
    }

    prevMin = min
    prevMax = max
  }

  const render = () => {
    const { hoverX, loaded } = chart.getAttributes()

    if ((!pie && !modern) || !loaded) return false

    if (modern) {
      triggerValueRange()
      chartUI.render()
      chartUI.trigger("rendered")
      return true
    }

    const { data } = chart.getPayload()

    let index = hoverX ? chart.getClosestRow(hoverX[0]) : -1
    index = index === -1 ? data.length - 1 : index

    const dimensionIds = chart.getVisibleDimensionIds()

    const values = dimensionIds
      .map(id => {
        const signedValue = chart.getDimensionValue(id, index, { abs: false })

        return {
          label: shortForLength(id, 30),
          value: Math.abs(signedValue),
          signedValue,
          color: chart.selectDimensionColor(id),
          caption: id,
          id,
        }
      })
      .filter(v => !!v.value)

    triggerValueRange()

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

    chartUI.render()
    chartUI.trigger("rendered")
    return true
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
    modern = false

    chartUI.unmount()
  }

  return {
    ...chartUI,
    mount,
    unmount,
    render,
  }
}
