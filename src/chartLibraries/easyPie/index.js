import EasyPie from "easy-pie-chart"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "../dygraph/makeResizeObserver"

const getUrlOptions = () => ["absolute"]

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let easyPie = null
  let renderedValue = 0
  let listeners
  let resizeObserver

  let prevMin
  let prevMax

  const mount = element => {
    if (easyPie) return

    chartUI.mount(element)

    const theme = chart.getAttribute("theme")
    element.classList.add(theme)

    const { loaded } = chart.getAttributes()

    chart.updateDimensions()

    const makeEasyPie = () => {
      easyPie = new EasyPie(element, {
        barColor: chart.getColors()[0],
        animate: { duration: 500, enabled: true },
        ...makeThemingOptions(),
        ...makeDimensionOptions(),
      })
    }

    makeEasyPie()

    resizeObserver = makeResizeObserver(element, () => {
      const canvas = easyPie.renderer.getCanvas()
      element.removeChild(canvas)
      makeEasyPie()
    })

    listeners = unregister(
      chart.onAttributeChange("hoverX", (hoverX, prevHoverX) => {
        if (Boolean(prevHoverX) !== Boolean(hoverX)) {
          if (hoverX) easyPie.disableAnimation()
          else easyPie.enableAnimation()
        }

        render()
      }),
      !loaded && chart.onceAttributeChange("loaded", render),
      chart.onAttributeChange("theme", () => {
        Object.assign(easyPie.options, makeThemingOptions())
        renderedValue = 0
        render()
      })
    )

    render()
  }

  const makeThemingOptions = () => ({
    trackColor: chartUI.getThemeAttribute("themeTrackColor"),
    scaleColor: chartUI.getThemeAttribute("themeScaleColor"),
  })

  const makeDimensionOptions = () => {
    const { clientWidth } = chartUI.getElement()
    const multiplier = clientWidth / 22
    return { lineWidth: multiplier < 4 ? 2 : Math.floor(multiplier), size: clientWidth }
  }

  const getMinMax = value => {
    let { min, max } = chart.getPayload()
    if (min < 0 && max === 0) {
      max = -min
      min = 0
    }

    const { units } = chart.getAttributes()
    if (units === "percentage") {
      min = 0
      max = 100
    }

    const minMax = [Math.min(min, value), Math.max(max, value)].sort()

    return minMax[0] === minMax[1] ? [minMax[0], minMax[1] + 1] : minMax
  }

  const render = () => {
    const { hoverX, loaded, after } = chart.getAttributes()

    if (!easyPie || !loaded) return

    if (!hoverX && after > 0) {
      renderedValue = 0
      easyPie.update(0)
      return chartUI.trigger("rendered")
    }

    const { result } = chart.getPayload()
    const row = hoverX ? chart.getClosestRow(hoverX[0]) : result.data.length - 1
    if (!result.data[row]) {
      debugger
    }
    const [, ...rows] = result.data[row]
    const value = rows.reduce((acc, v) => acc + v, 0)
    let [min, max] = getMinMax(value)

    if (renderedValue === value && min === prevMin && max === prevMax) return

    chartUI.render()

    renderedValue = value
    const percentage = ((value - min) / (max - min)) * 100
    easyPie.update(percentage)

    if (min !== prevMin || max !== prevMax) {
      prevMin = min
      prevMax = max
      chartUI.sdk.trigger("yAxisChange", chart, min, max)
    }

    chartUI.trigger("rendered")
  }

  const getValue = () => renderedValue

  const unmount = () => {
    if (listeners) listeners()
    if (resizeObserver) resizeObserver()

    if (easyPie) {
      easyPie.renderer.clear()
      easyPie = null
    }

    renderedValue = 0
    prevMin = null
    prevMax = null

    chartUI.unmount()
  }

  const instance = {
    ...chartUI,
    format: "array",
    mount,
    unmount,
    render,
    getValue,
    getUrlOptions,
  }

  return instance
}
