import { Gauge } from "gaugeJS"
import dimensionColors from "@/sdk/theme/dimensionColors"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"

const getUrlOptions = () => ["absolute"]

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let gauge = null
  let listeners
  let renderedValue = 0
  let prevMin
  let prevMax

  const mount = element => {
    if (gauge) return

    chartUI.mount(element)

    const { color, strokeColor } = makeThemingOptions()

    gauge = new Gauge(element).setOptions({
      angle: 0.14,
      lineWidth: 0.57,
      pointer: {
        length: 0.85,
        strokeWidth: 0.045,
        color,
      },
      limitMax: true,
      limitMin: true,
      colorStart: dimensionColors[0],
      strokeColor,
      generateGradient: false,
    })

    gauge.maxValue = 100
    gauge.setMinValue(0)

    const { loaded } = chart.getAttributes()

    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render),
      chart.onAttributeChange("theme", () => {
        // Object.assign(easyPie.options, makeThemingOptions())
        render()
      })
    )

    render()
  }
  const makeThemingOptions = () => ({
    color: chartUI.getThemeAttribute("themeGaugePointer"),
    strokeColor: chartUI.getThemeAttribute("themeGaugeStroke"),
  })

  const getMinMax = value => {
    const { units } = chart.getAttributes()
    if (units === "percentage") return [0, 100]

    const { min, max } = chart.getPayload()

    return [Math.min(Math.min(min, 0), value), Math.max(Math.max(max, 0), value)]
  }

  const render = () => {
    const { hoverX, loaded } = chart.getAttributes()

    if (!gauge || !loaded) return

    const { result } = chart.getPayload()

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : 0
    const [, value] = result.data[row]
    const [min, max] = getMinMax(value)

    if (renderedValue === value && min === prevMin && max === prevMax) return

    chartUI.render()

    if (min !== prevMin || max !== prevMax) {
      prevMin = min
      prevMax = max
      chartUI.sdk.trigger("yAxisChange", chart, min, max)
    }

    // const [, ...rows] = result[row]
    // const value = rows.reduce((acc, v) => acc + v)

    renderedValue = value
    const percentage = ((value - min) / (max - min)) * 100
    gauge.set(percentage)

    chartUI.trigger("rendered")
  }

  const getValue = () => renderedValue

  const unmount = () => {
    if (listeners) listeners()

    if (!gauge) return

    gauge = null
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
