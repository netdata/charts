import { Gauge } from "gaugeJS"
import { copyCanvas, createCanvas } from "@/helpers/canvas"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"

const getUrlOptions = () => ["absolute"]

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let gauge = null
  let listeners
  let renderedValue = 0
  let prevMin
  let prevMax
  let resizeObserver

  const mount = element => {
    if (gauge) return

    chartUI.mount(element)

    const { color, strokeColor } = makeThemingOptions()

    chart.consumePayload()
    chart.updateDimensions()

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
    })

    gauge = new Gauge(element).setOptions(makeGaugeOptions())

    gauge.maxValue = 100
    gauge.setMinValue(0)

    resizeObserver = makeResizeObserver(element.parentNode, () => {
      const height = element.parentNode.clientHeight * 0.9
      element.G__height = height
      element.style.height = `${height}px`
      const width = element.parentNode.clientWidth
      element.G__width = width
      element.style.width = `${width}px`
      gauge = gauge.configDisplayScale()

      gauge.maxValue = 100
      gauge.setMinValue(0)

      chartUI.trigger("resize")
    })

    const { loaded } = chart.getAttributes()

    listeners = unregister(
      chart.onAttributeChange("hoverX", (hoverX, prevHoverX) => {
        if (Boolean(hoverX) !== Boolean(prevHoverX)) {
          const animationSpeed = hoverX ? Number.MAX_VALUE : 32
          gauge.animationSpeed = animationSpeed
        }
        render()
      }),
      !loaded && chart.onceAttributeChange("loaded", render),
      chart.onAttributeChange("theme", () => {
        const { color, strokeColor } = makeThemingOptions()
        gauge.options.strokeColor = strokeColor
        gauge.options.pointer.color = color
        gauge.render()
      })
    )

    render()
  }
  const makeThemingOptions = () => ({
    color: chartUI.getThemeAttribute("themeGaugePointer"),
    strokeColor: chartUI.getThemeAttribute("themeGaugeStroke"),
  })

  const getMinMax = (value = 0) => {
    let { min, max } = chart.getAttributes()

    const units = chart.getUnitSign()

    if (/%/.test(units)) {
      min = 0
      max = 100
    }

    const minMax = [Math.min(min, value), Math.max(max, value)].sort((a, b) => a - b)

    return minMax[0] === minMax[1] ? [minMax[0], minMax[1] + 1] : minMax
  }

  const render = () => {
    chartUI.render()

    const { hoverX, loaded, after } = chart.getAttributes()

    if (!gauge || !loaded) return

    chart.consumePayload()

    if (!hoverX && after > 0) {
      renderedValue = null
      gauge.set(0)
      return chartUI.trigger("rendered")
    }

    const { data } = chart.getPayload()

    if (data?.length === undefined) return

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : data.length - 1

    const rowData = data[row]
    if (!Array.isArray(rowData)) return

    const [, ...rows] = rowData

    const value = rows.reduce((acc, v) => acc + v, 0)

    let [min, max] = getMinMax(value)

    if (min !== prevMin || max !== prevMax) {
      chartUI.sdk.trigger("yAxisChange", chart, min, max)
    }

    if (renderedValue === value && min === prevMin && max === prevMax) return

    prevMin = min
    prevMax = max

    chartUI.render()

    renderedValue = value
    const percentage = Math.max(Math.min(((value - min) / (max - min)) * 100, 99.999), 0.001)
    gauge.set(percentage)

    chartUI.trigger("rendered")
  }

  const getValue = () => renderedValue

  const unmount = () => {
    if (listeners) listeners()

    if (resizeObserver) resizeObserver()
    gauge = null
    prevMin = null
    prevMax = null
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
    getMinMax,
  }

  return instance
}
