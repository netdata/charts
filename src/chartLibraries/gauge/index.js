import Gauge from "./library"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import lightenColor from "./makeGradientColors"
import makeThresholdStops from "./makeThresholdStops"

const makeGradientFillStyle = (lightColor, fullColor) => g => {
  if (!g.ctx.createConicGradient) return fullColor

  const w = g.canvas.width / 2
  const h =
    g.canvas.height * g.paddingTop +
    g.availableHeight -
    (g.radius + g.lineWidth / 2) * g.extraPadding

  const arcStart = (1 + g.options.angle) * Math.PI
  const displayedAngle = g.getAngle(g.displayedValue)
  const fraction = Math.max((displayedAngle - arcStart) / (2 * Math.PI), 0.001)

  const gradient = g.ctx.createConicGradient(arcStart, w, h)
  gradient.addColorStop(0, lightColor)
  gradient.addColorStop(fraction, fullColor)

  return gradient
}

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let gauge = null
  let listeners
  let prevMin
  let prevMax
  let resizeObserver
  let gaugeCanvas = null
  let ownsCanvas = false

  const mount = element => {
    if (gauge) return

    chartUI.mount(element)

    gaugeCanvas = element.firstElementChild?.tagName === "CANVAS"
      ? element.firstElementChild
      : document.createElement("canvas")
    ownsCanvas = !gaugeCanvas.parentNode
    if (ownsCanvas) element.appendChild(gaugeCanvas)

    const { color, strokeColor } = makeThemingOptions()
    const { staticZones, gaugeLineWidth, gaugeGradient, gaugeThresholds } = chart.getAttributes()
    const hasThresholds = Array.isArray(gaugeThresholds) && gaugeThresholds.length > 0
    const dimensionColor = chart.selectDimensionColor()

    const makeGaugeOptions = () => ({
      angle: -0.2,
      lineWidth: gaugeLineWidth,
      radiusScale: 1,
      pointer: {
        length: 0.6,
        strokeWidth: 0.035,
        color,
      },
      strokeColor,
      limitMax: false,
      limitMin: false,
      colorStart: dimensionColor,
      generateGradient: true,
      highDpiSupport: true,
      ...(gaugeGradient &&
        !hasThresholds && {
          customFillStyle: makeGradientFillStyle(lightenColor(dimensionColor), dimensionColor),
        }),
      ...(staticZones && {
        staticZones: [{ strokeStyle: strokeColor, min: 0, max: 100, height: 1 }, ...staticZones],
      }),
    })

    gauge = new Gauge(gaugeCanvas).setOptions(makeGaugeOptions())

    gauge.maxValue = 100
    gauge.animationSpeed = Number.MAX_VALUE
    gauge.setMinValue(0)

    resizeObserver = makeResizeObserver(
      element,
      () => {
        const minWidth = element.clientWidth
        const height = (element.clientHeight > minWidth ? minWidth : element.clientHeight) * 0.9
        gaugeCanvas.G__height = height
        gaugeCanvas.style.height = `${height}px`
        const width = minWidth
        gaugeCanvas.G__width = width
        gaugeCanvas.style.width = `${width}px`

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
      chart.onAttributeChange("gaugeThresholds", applyThresholds),
      chart.onAttributeChange("staticZones", () => chart.reconcileChartLibrary()),
      chart.onAttributeChange("theme", () => {
        const { color, strokeColor } = makeThemingOptions()
        const updatedDimensionColor = chart.selectDimensionColor()
        const { gaugeThresholds: thresholds } = chart.getAttributes()
        const themeHasThresholds = Array.isArray(thresholds) && thresholds.length > 0
        gauge.setOptions({
          strokeColor,
          pointer: { color },
          ...(gaugeGradient &&
            !themeHasThresholds && {
              customFillStyle: makeGradientFillStyle(
                lightenColor(updatedDimensionColor),
                updatedDimensionColor
              ),
            }),
        })
        if (themeHasThresholds) applyThresholds()
      })
    )

    const minWidth = element.clientWidth
    const height = (element.clientHeight > minWidth ? minWidth : element.clientHeight) * 0.9
    gaugeCanvas.G__height = height
    gaugeCanvas.style.height = `${height}px`
    const width = minWidth
    gaugeCanvas.G__width = width
    gaugeCanvas.style.width = `${width}px`

    gauge.setOptions({})
    render()
  }
  const makeThemingOptions = () => ({
    color: chartUI.chart.getThemeAttribute("themeGaugePointer"),
    strokeColor: chartUI.chart.getThemeAttribute("themeGaugeStroke"),
  })

  const getMinMax = () => chart.getAttribute("getValueRange")(chart)

  const applyThresholds = () => {
    if (!gauge) return

    const { gaugeGradient, gaugeThresholds: thresholds } = chart.getAttributes()
    const [min, max] = getMinMax()
    const stops = makeThresholdStops(
      thresholds,
      min,
      max,
      chart.getThemeIndex(),
      chart.selectDimensionColor()
    )

    if (stops) {
      gauge.setOptions({
        percentColors: stops,
        generateGradient: false,
        customFillStyle: undefined,
      })
      return
    }

    const dimensionColor = chart.selectDimensionColor()
    gauge.setOptions({
      percentColors: undefined,
      generateGradient: true,
      ...(gaugeGradient && {
        customFillStyle: makeGradientFillStyle(lightenColor(dimensionColor), dimensionColor),
      }),
    })
  }

  const render = () => {
    const { hoverX, loaded } = chart.getAttributes()

    if (!gauge || !loaded) return false

    const { data } = chart.getPayload()

    if (data?.length === undefined) return false

    const row = hoverX ? chart.getClosestRow(hoverX[0]) : data.length - 1

    const rowData = data[row]
    if (!Array.isArray(rowData)) return chartUI.render()

    const [, ...rows] = rowData

    const value = rows.reduce((acc, v = 0) => acc + v, 0)

    let [min, max] = getMinMax()

    if (min !== prevMin || max !== prevMax) {
      chart.trigger("yAxisChange", min, max)
      applyThresholds()
    }

    prevMin = min
    prevMax = max

    const percentage = Math.max(Math.min(((value - min) / (max - min)) * 100, 99.999), 0.001)
    gauge.set(percentage)

    chartUI.render()
    chartUI.trigger("rendered")
    return true
  }

  const unmount = () => {
    if (listeners) listeners()

    if (resizeObserver) resizeObserver()
    gauge = null
    if (ownsCanvas) gaugeCanvas?.remove()
    gaugeCanvas = null
    ownsCanvas = false
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
