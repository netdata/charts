import EasyPie from "easy-pie-chart"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import { isModernFlavour, sumRow, toPercentage } from "./ringValue"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let easyPie = null
  let listeners
  let resizeObserver
  let mounted = false

  let prevMin
  let prevMax

  const mount = element => {
    if (easyPie || mounted) return

    mounted = true
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

    if (!isModernFlavour(chart)) makeEasyPie()

    const reMake = () => {
      if (easyPie) {
        const canvas = easyPie.renderer.getCanvas()
        easyPie.renderer.clear()
        if (canvas.parentNode === element) element.removeChild(canvas)
        easyPie = null
      }
      if (!isModernFlavour(chart)) makeEasyPie()
    }

    resizeObserver = makeResizeObserver(
      element,
      () => {
        reMake()
        chartUI.trigger("resize")
      },
      () => chartUI.trigger("resize")
    )

    listeners = unregister(
      chart.onAttributeChange("hoverX", (hoverX, prevHoverX) => {
        if (easyPie && Boolean(prevHoverX) !== Boolean(hoverX)) {
          if (hoverX) easyPie.disableAnimation()
          else easyPie.enableAnimation()
        }

        render()
      }),
      !loaded && chart.onceAttributeChange("loaded", render),
      chart.onAttributeChange("theme", reMake),
      chart.onAttributeChange("designFlavour", () => {
        if (isModernFlavour(chart) !== Boolean(easyPie)) return
        reMake()
        render()
      })
    )

    render()
  }

  const makeThemingOptions = () => ({
    trackColor: chart.getThemeAttribute("themeEasyPieTrackColor"),
    scaleColor: chart.getThemeAttribute("themeEasyPieScaleColor"),
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

  const getMinMax = () => chart.getAttribute("getValueRange")(chart)

  const render = () => {
    const { hoverX, loaded } = chart.getAttributes()

    if ((!easyPie && !isModernFlavour(chart)) || !loaded) return false

    const { data } = chart.getPayload()

    if (data?.length === undefined) return false

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : data.length - 1

    const rowData = data[row]
    if (!Array.isArray(rowData)) return chartUI.render()

    const value = sumRow(rowData)
    let [min, max] = getMinMax()

    if (easyPie) easyPie.update(toPercentage(value, min, max))

    if (min !== prevMin || max !== prevMax) {
      chart.trigger("yAxisChange", min, max)
    }

    prevMin = min
    prevMax = max

    chartUI.render()
    chartUI.trigger("rendered")
    return true
  }

  const unmount = () => {
    if (listeners) listeners()
    if (resizeObserver) resizeObserver()

    if (easyPie) {
      easyPie.renderer.clear()
      easyPie = null
    }

    mounted = false

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
