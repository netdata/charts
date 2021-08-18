import EasyPie from "easy-pie-chart"
import dimensionColors from "@/sdk/theme/dimensionColors"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"

const getUrlOptions = () => ["absolute"]

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let easyPie = null
  let renderedValue = 0
  let listeners

  let prevMin
  let prevMax

  const mount = element => {
    if (easyPie) return

    chartUI.mount(element)

    const theme = chart.getAttribute("theme")
    element.classList.add(theme)

    const { loaded } = chart.getAttributes()

    easyPie = new EasyPie(element, {
      barColor: dimensionColors[0],
      animate: { duration: 500, enabled: true },
      ...makeThemingOptions(),
      ...makeDimensionOptions(element),
    })

    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render),
      chart.onAttributeChange("theme", () => {
        Object.assign(easyPie.options, makeThemingOptions())
        render()
      })
    )

    render()
  }

  const makeThemingOptions = () => ({
    trackColor: chartUI.getThemeAttribute("themeTrackColor"),
    scaleColor: chartUI.getThemeAttribute("themeScaleColor"),
  })

  const makeDimensionOptions = element => {
    const { clientWidth } = element
    const multiplier = clientWidth / 22
    return { lineWidth: multiplier < 4 ? 2 : Math.floor(multiplier), size: clientWidth }
  }

  const render = () => {
    const { hoverX, loaded } = chart.getAttributes()

    if (!easyPie || !loaded) return

    const { min, max, result } = chart.getPayload()

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : 0
    const [, value] = result.data[row]

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
    easyPie.update(percentage)

    chartUI.trigger("rendered")
  }

  const getValue = () => renderedValue

  const unmount = () => {
    if (listeners) listeners()

    if (!easyPie) return

    easyPie.renderer.clear()
    easyPie = null
  }

  const getChartWidth = () => {
    return easyPie ? easyPie.renderer.getCanvas().clientWidth : chartUI.getEstimatedChartWidth()
  }

  const getChartHeight = () => {
    return easyPie ? easyPie.renderer.getCanvas().clientHeight : chartUI.getEstimatedChartWidth()
  }

  const instance = {
    ...chartUI,
    getChartWidth,
    getChartHeight,
    mount,
    unmount,
    render,
    getValue,
    getUrlOptions,
  }

  return instance
}
