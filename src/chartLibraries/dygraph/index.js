import Dygraph from "dygraphs"
import { format } from "date-fns"
import makeChartUI from "@/sdk/makeChartUI"
import dimensionColors from "@/sdk/theme/dimensionColors"
import executeLatest from "@/helpers/executeLatest"
import makeNavigation from "./navigation"
import makeHover from "./hover"
import makeHoverX from "./hoverX"
import makeHighlight from "./highlight"
import crosshair from "./crosshair"

const axisLabelFormatter = time => {
  const midnight = time.getSeconds() === 0 && time.getMinutes() === 0 && time.getHours() === 0
  return format(time, midnight ? "MM:dd" : "HH:mm:SS")
}

const getDateWindow = chart => {
  const { after, before } = chart.getAttributes()

  if (after > 0) return [after * 1000, before * 1000]

  const now = Date.now()
  return [now + after * 1000, now]
}

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let dygraph = null
  let listeners = []
  let navigation = null
  let hover = null
  let hoverX = null
  let highlight = null

  const mount = element => {
    if (dygraph) return

    chartUI.mount(element)

    const theme = chart.getAttribute("theme")
    element.classList.add(theme)

    const attributes = chart.getAttributes()
    const payload = chart.getPayload()
    const { chartType } = chart.getMetadata()
    const stacked = chartType === "stacked"
    const area = chartType === "area"
    const line = chartType === "line"
    const sparkline = false
    const logScale = false

    const smooth = line && !sparkline

    let prevMin
    let prevMax

    const strokeWidth = stacked ? 0.1 : smooth ? 1.5 : 0.7

    dygraph = new Dygraph(element, payload.result.data, {
      showLabelsOnHighlight: false,
      labels: payload.result.labels,
      axes: {
        x: {
          ticker: Dygraph.dateTicker,
          axisLabelFormatter,
          axisLabelWidth: 60,
        },
        y: {
          axisLabelFormatter: (y, granularity, opts, d) => {
            const [min, max] = d.axes_[0].extremeRange

            if (min !== prevMin || max !== prevMax) {
              prevMin = min
              prevMax = max
              chartUI.sdk.trigger("yAxisChange", chart, min, max)
            }

            return chart.getConvertedValue(y)
          },
          pixelsPerLabel: 15,
        },
      },

      dateWindow: getDateWindow(chart),
      highlightCallback: executeLatest((event, x, points, row, seriesName) =>
        chartUI.trigger("highlightCallback", event, x, points, row, seriesName)
      ),
      unhighlightCallback: executeLatest(() => chartUI.trigger("unhighlightCallback")),
      underlayCallback: (canvas, area, g) => chartUI.trigger("underlayCallback", canvas, area, g),
      interactionModel: {
        mouseout: executeLatest((...args) => chartUI.trigger("mouseout", ...args)),
        mousedown: executeLatest((...args) => chartUI.trigger("mousedown", ...args)),
        mousemove: executeLatest((...args) => chartUI.trigger("mousemove", ...args)),
        mouseover: executeLatest((...args) => chartUI.trigger("mouseover", ...args)),
        mouseup: executeLatest((...args) => chartUI.trigger("mouseup", ...args)),
        touchstart: executeLatest((...args) => chartUI.trigger("touchstart", ...args)),
        touchmove: executeLatest((...args) => chartUI.trigger("touchmove", ...args)),
        touchend: executeLatest((...args) => chartUI.trigger("touchend", ...args)),
        dblclick: executeLatest((...args) => chartUI.trigger("dblclick", ...args)),
      },

      highlightSeriesOpts: {
        strokeWidth: strokeWidth * 1.5,
        // strokeBorderWidth: stacked ? null : 1,
        // highlightCircleSize: 3,
      },
      // strokeBorderColor: "#FFFFFF",
      strokeBorderWidth: 0,
      stackedGraph: stacked,
      fillGraph: stacked || area,
      fillAlpha: stacked ? 0.8 : 0.2,
      axisLabelFontSize: 10,
      axisLineWidth: 1,
      gridLineWidth: 1,
      maxNumberWidth: 8,
      highlightCircleSize: sparkline ? 3 : 4,
      highlightSeriesBackgroundAlpha: 1,
      strokeWidth,
      drawGapEdgePoints: true,
      ylabel: attributes.unit,
      yLabelWidth: 12,
      yRangePad: 1,
      includeZero: stacked,
      labelsSeparateLines: true,
      colors: dimensionColors,
      ...makeTheming(),
      // visibility return selected dimensions
      // logscale
    })

    hoverX.toggle(attributes.enabledHover)
    navigation.set(attributes.navigation)

    listeners = [
      chart.onAttributeChange("hoverX", dimensions => {
        const prevSelection = dygraph.getSelection()
        const nextSelection = dimensions ? chart.getClosestRow(dimensions[0]) : -1

        if (prevSelection !== nextSelection) {
          dygraph.setSelection(nextSelection)
        }

        if (nextSelection !== -1) {
          crosshair(instance, nextSelection)
        }
      }),
      chart.on("after", () => {
        const { after, before } = chart.getAttributes()
        dygraph.updateOptions({ dateWindow: [after * 1000, before * 1000] })
      }),
      chart.onAttributeChange("enabledHover", hoverX.toggle),
      chart.onAttributeChange("navigation", navigation.set),
      chart.onAttributeChange("highlight", highlight.toggle),
      chart.onAttributeChange("theme", () => dygraph.updateOptions(makeTheming())),
    ]

    hover = makeHover(instance)

    render()
  }

  const makeTheming = () => {
    const themeGridColor = chartUI.getThemeAttribute("themeGridColor")
    return { axisLineColor: themeGridColor, gridLineColor: themeGridColor }
  }

  const unmount = () => {
    if (!dygraph) return

    listeners.forEach(listener => listener())
    listeners = []
    chartUI.unmount()
    hover()
    hoverX.destroy()
    highlight.destroy()
    navigation.destroy()
    dygraph.destroy()
    dygraph = null
  }

  const getDygraph = () => dygraph

  const render = () => {
    if (!dygraph) return

    chartUI.render()
    const { result } = chart.getPayload()
    const dateWindow = getDateWindow(chart)

    dygraph.updateOptions({
      file: result.data,
      labels: result.labels,
      dateWindow,
    })
    chart.updateDimensions()
  }

  const getPixelsPerPoint = () => 3

  const getChartWidth = () => (dygraph ? dygraph.getArea().w : chartUI.getEstimatedChartWidth())
  const getChartHeight = () => (dygraph ? dygraph.getArea().h : 100)

  const getUrlOptions = () => ["ms", "flip"]

  const instance = {
    ...chartUI,
    getChartWidth,
    getChartHeight,
    getPixelsPerPoint,
    getUrlOptions,
    mount,
    unmount,
    getDygraph,
    render,
  }

  navigation = makeNavigation(instance)
  hoverX = makeHoverX(instance)
  highlight = makeHighlight(instance)

  return instance
}
