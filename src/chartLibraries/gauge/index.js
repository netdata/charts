import Gauge from "./library"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let gauge = null
  let listeners
  let prevMin
  let prevMax
  let resizeObserver

  const mount = element => {
    if (gauge) return

    chartUI.mount(element)

    const { color, strokeColor } = makeThemingOptions()
    const { staticZones } = chart.getAttributes()

    const makeGaugeOptions = () => ({
      angle: -0.2, // The span of the gauge arc
      lineWidth: 0.2, // The line thickness
      radiusScale: 1, // Relative radius
      pointer: {
        length: 0.6,
        strokeWidth: 0.035,
        color,
      },
      strokeColor,
      limitMax: false,
      limitMin: false,
      colorStart: chart.selectDimensionColor(), // Colors
      generateGradient: true,
      highDpiSupport: true, // High resolution support
      ...(staticZones && {
        staticZones: [{ strokeStyle: strokeColor, min: 0, max: 100, height: 1 }, ...staticZones],
      }),
    })

    gauge = new Gauge(element.firstChild).setOptions(makeGaugeOptions())

    gauge.maxValue = 100
    gauge.animationSpeed = Number.MAX_VALUE
    gauge.setMinValue(0)

    resizeObserver = makeResizeObserver(
      element,
      () => {
        const minWidth = element.clientWidth
        const height = (element.clientHeight > minWidth ? minWidth : element.clientHeight) * 0.9
        element.firstChild.G__height = height
        element.firstChild.style.height = `${height}px`
        const width = minWidth
        element.firstChild.G__width = width
        element.firstChild.style.width = `${width}px`

        gauge.setOptions({})
        gauge.update(true)
        chartUI.trigger("resize")
      },
      () => chartUI.trigger("resize")
    )

    const { loaded } = chart.getAttributes()

    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render),
      chart.onAttributeChange("theme", () => {
        const { color, strokeColor } = makeThemingOptions()
        gauge.setOptions({ strokeColor, pointer: { color } })
      })
    )

    const minWidth = element.clientWidth
    const height = (element.clientHeight > minWidth ? minWidth : element.clientHeight) * 0.9
    element.firstChild.G__height = height
    element.firstChild.style.height = `${height}px`
    const width = minWidth
    element.firstChild.G__width = width
    element.firstChild.style.width = `${width}px`

    gauge.setOptions({})
    render()
  }
  const makeThemingOptions = () => ({
    color: chartUI.chart.getThemeAttribute("themeGaugePointer"),
    strokeColor: chartUI.chart.getThemeAttribute("themeGaugeStroke"),
  })

  const getMinMax = () => chart.getAttribute("getValueRange")(chart)

  const render = () => {
    chartUI.render()

    const { hoverX, loaded } = chart.getAttributes()

    if (!gauge || !loaded) return

    const { data } = chart.getPayload()

    if (data?.length === undefined) return

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : data.length - 1

    const rowData = data[row]
    if (!Array.isArray(rowData)) return

    const [, ...rows] = rowData

    const value = rows.reduce((acc, v = 0) => acc + v, 0)

    let [min, max] = getMinMax()

    if (min !== prevMin || max !== prevMax) {
      chartUI.sdk.trigger("yAxisChange", chart, min, max)
    }

    prevMin = min
    prevMax = max

    chartUI.render()

    const percentage = Math.max(Math.min(((value - min) / (max - min)) * 100, 99.999), 0.001)
    gauge.set(percentage)

    chartUI.trigger("rendered")
  }

  const unmount = () => {
    if (listeners) listeners()

    if (resizeObserver) resizeObserver()
    gauge = null
    prevMin = null
    prevMax = null

    chartUI.unmount()
  }

  const instance = {
    ...chartUI,
    mount,
    unmount,
    render,
    getMinMax,
  }

  return instance
}
