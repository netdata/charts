import EasyPie from "easy-pie-chart"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let easyPie = null
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

    const makeEasyPie = () => {
      easyPie = new EasyPie(element, {
        barColor: chart.selectDimensionColor(),
        animate: false,
        ...makeThemingOptions(),
        ...makeDimensionOptions(),
      })
    }

    makeEasyPie()

    const reMake = () => {
      const canvas = easyPie.renderer.getCanvas()
      easyPie.renderer.clear()
      element.removeChild(canvas)
      makeEasyPie()
    }

    resizeObserver = makeResizeObserver(element, () => {
      reMake()
      chartUI.trigger("resize")
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
      chart.onAttributeChange("theme", reMake)
    )

    chartUI.trigger("resize")
    render()
  }

  const makeThemingOptions = () => ({
    trackColor: chartUI.chart.getThemeAttribute("themeEasyPieTrackColor"),
    scaleColor: chartUI.chart.getThemeAttribute("themeEasyPieScaleColor"),
  })

  const makeDimensionOptions = () => {
    const { clientWidth, clientHeight } = chartUI.getElement()
    const size = clientWidth < clientHeight ? clientWidth : clientHeight
    const multiplier = size / 22

    return {
      lineWidth: multiplier < 4 ? 2 : Math.floor(multiplier),
      size: size < 20 ? 20 : size,
      scaleLength: multiplier < 4 ? 2 : Math.floor(multiplier),
    }
  }

  const getMinMax = value => {
    let { min, max } = chart.getAttributes()
    if (min < 0 && max === 0) {
      max = -min
      min = 0
    }

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

    if (!easyPie || !loaded) return

    if (!hoverX && after > 0) {
      easyPie.update(0)
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

    chartUI.render()

    const percentage = ((value - min) / (max - min)) * 100

    easyPie.update(percentage)

    if (min !== prevMin || max !== prevMax) {
      prevMin = min
      prevMax = max
      chartUI.sdk.trigger("yAxisChange", chart, min, max)
    }

    chartUI.trigger("rendered")
  }

  const unmount = () => {
    if (listeners) listeners()
    if (resizeObserver) resizeObserver()

    if (easyPie) {
      easyPie.renderer.clear()
      easyPie = null
    }

    prevMin = null
    prevMax = null

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
