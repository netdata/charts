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

  const getMinMax = () => {
    let { getValueRange, min, max, valueRange } = chart.getAttributes()
    return getValueRange({ min, max, valueRange })
  }

  const render = () => {
    chartUI.render()

    const { hoverX, loaded } = chart.getAttributes()

    if (!easyPie || !loaded) return

    const { data } = chart.getPayload()

    if (data?.length === undefined) return

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : data.length - 1

    const rowData = data[row]
    if (!Array.isArray(rowData)) return

    const [, ...rows] = rowData
    const value = rows.reduce((acc, v) => acc + v, 0)
    let [min, max] = getMinMax()

    chartUI.render()

    const percentage = ((value - min) / (max - min)) * 100

    easyPie.update(percentage)

    if (min !== prevMin || max !== prevMax) {
      chartUI.sdk.trigger("yAxisChange", chart, min, max)
    }

    prevMin = min
    prevMax = max

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
