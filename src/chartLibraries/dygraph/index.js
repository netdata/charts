import Dygraph from "dygraphs"
import { format } from "date-fns"
import makeChartUI from "@/sdk/makeChartUI"
import executeLatest from "@/helpers/executeLatest"
import makeNavigation from "./navigation"
import makeHover from "./hover"
import makeHoverX from "./hoverX"
import makeOverlays from "./overlays"
import crosshair from "./crosshair"
import makeResizeObserver from "./makeResizeObserver"

const axisLabelFormatter = time => {
  const midnight = time.getHours() === 0 && time.getMinutes() === 0 && time.getSeconds() === 0
  return format(time, midnight ? "MM:dd" : "HH:mm:ss")
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
  let overlays = null
  let resizeObserver = null

  const mount = element => {
    if (dygraph) return

    chartUI.mount(element)

    const theme = chart.getAttribute("theme")
    element.classList.add(theme)

    chart.updateDimensions()
    const attributes = chart.getAttributes()
    const payload = chart.getPayload()

    let prevMin
    let prevMax

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
      drawCallback: (...args) => chartUI.trigger("drawCallback", ...args),
      underlayCallback: executeLatest((...args) => chartUI.trigger("underlayCallback", ...args)),
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

      strokeBorderWidth: 0,
      axisLabelFontSize: 10,
      axisLineWidth: 1,
      gridLineWidth: 1,
      maxNumberWidth: 8,
      highlightSeriesBackgroundAlpha: 1,
      drawGapEdgePoints: true,
      // ylabel: attributes.unit,
      yLabelWidth: 12,
      yRangePad: 1,
      labelsSeparateLines: true,
      colors: chart.getColors(),
      valueRange: attributes.valueRange,
      ...makeChartTypeOptions(),
      ...makeThemingOptions(),
      ...makeVisibilityOptions(),
      ...makeDataOptions(),
      // visibility return selected dimensions
      // logscale
    })

    // dygraph.mouseMoveHandler_
    // removeEvent(dygraph.mouseEventElement_, "mousemove", dygraph.mouseMoveHandler_)
    // dygraph.mouseMoveHandler_ = null

    // const mousemove = event => {
    //   const callback = dygraph.getFunctionOption("highlightCallback")

    //   callback.call(
    //     dygraph,
    //     event,
    //     dygraph.lastx_,
    //     dygraph.selPoints_,
    //     dygraph.lastRow_,
    //     dygraph.highlightSet_
    //   )
    // }
    // dygraph.addAndTrackEvent(dygraph.mouseEventElement_, "mousemove", mousemove)

    resizeObserver = makeResizeObserver(element, () => dygraph.resize())

    hoverX.toggle(attributes.enabledHover)
    navigation.set(attributes.navigation)

    listeners = [
      chart.onAttributeChange(
        "hoverX",
        executeLatest(dimensions => {
          const nextSelection = dimensions ? chart.getClosestRow(dimensions[0]) : -1
          // const { canvas_ctx_: ctx } = dygraph
          // const { w, h } = dygraph.getArea()
          // ctx.clearRect(0, 0, w, h)
          // dygraph.previousVerticalX_ = null
          dygraph.setSelection(nextSelection)

          if (nextSelection === -1) return

          crosshair(instance, nextSelection)
        })
      ),
      chart.onAttributeChange("after", render),
      chart.onAttributeChange("enabledHover", hoverX.toggle),
      chart.onAttributeChange("navigation", navigation.set),
      chart.onAttributeChange("overlays", overlays.toggle),
      chart.onAttributeChange("theme", (nextTheme, prevTheme) => {
        element.classList.remove(prevTheme)
        element.classList.add(nextTheme)
        dygraph.updateOptions(makeThemingOptions())
      }),
      chart.onAttributeChange("chartType", () => dygraph.updateOptions(makeChartTypeOptions())),
      chart.onAttributeChange("selectedDimensions", () => {
        dygraph.updateOptions(makeVisibilityOptions())
      }),
      chart.onAttributeChange("valueRange", valueRange => {
        dygraph.updateOptions({ valueRange })
      }),
    ]

    hover = makeHover(instance)
    overlays.toggle()

    chartUI.render()
    chartUI.trigger("rendered")
  }

  const makeChartTypeOptions = () => {
    const chartType = chart.getAttribute("chartType") || chart.getMetadata().chartType

    const stacked = chartType === "stacked"
    const area = chartType === "area"
    const line = chartType === "line"
    const sparkline = false
    const logScale = false

    const smooth = line && !sparkline

    const strokeWidth = stacked ? 0.1 : smooth ? 1.5 : 0.7

    return {
      stackedGraph: stacked,
      fillGraph: stacked || area,
      fillAlpha: stacked ? 0.8 : 0.2,
      highlightCircleSize: sparkline ? 3 : 4,
      strokeWidth,
      includeZero: stacked,
    }
  }

  const makeThemingOptions = () => {
    const themeGridColor = chartUI.getThemeAttribute("themeGridColor")
    return { axisLineColor: themeGridColor, gridLineColor: themeGridColor }
  }

  const makeVisibilityOptions = () => {
    const selectedDimensions = chart.getAttribute("selectedDimensions")

    const { dimensionIds } = chart.getPayload()

    const selectedDimensionsSet = new Set(selectedDimensions)
    const visibility = selectedDimensions
      ? dimensionIds.map(id => selectedDimensionsSet.has(id))
      : dimensionIds.map(() => true)

    return { visibility }
  }

  const makeDataOptions = () => {
    const { result } = chart.getPayload()
    const dateWindow = getDateWindow(chart)

    return {
      file: result.data,
      labels: result.labels,
      dateWindow,
    }
  }

  const unmount = () => {
    if (!dygraph) return

    resizeObserver()
    listeners.forEach(listener => listener())
    listeners = []
    chartUI.unmount()
    hover()
    hoverX.destroy()
    navigation.destroyAll()
    overlays.destroy()
    dygraph.destroy()
    dygraph = null
  }

  const getDygraph = () => dygraph

  const render = () => {
    if (!dygraph) return

    chartUI.render()

    dygraph.updateOptions(makeDataOptions())
    chart.updateDimensions()
    chartUI.trigger("rendered")
  }

  const getPreceded = () => {
    if (!dygraph) return -1

    const { firstEntry } = chartUI.chart.getMetadata()
    const firstEntryMs = firstEntry * 1000
    const [after] = dygraph.xAxisRange()

    if (firstEntryMs < after) return -1

    const [afterExtreme] = dygraph.xAxisExtremes()
    return dygraph.toDomXCoord(afterExtreme)
  }

  const getEstimatedChartWidth = () => {
    const element = dygraph.getElement()
    const width = element ? element.offsetWidth : chartUI.getEstimatedWidth() || 300
    const legendWidth = chart.getAttribute("legend") ? 140 : 0
    return width - legendWidth
  }

  const getChartWidth = () => (dygraph ? dygraph.getArea().w : chartUI.getEstimatedChartWidth())
  const getChartHeight = () => (dygraph ? dygraph.getArea().h : 100)

  const instance = {
    ...chartUI,
    getEstimatedChartWidth,
    getChartWidth,
    getChartHeight,
    getPreceded,
    mount,
    unmount,
    getDygraph,
    render,
  }

  navigation = makeNavigation(instance)
  hoverX = makeHoverX(instance)
  overlays = makeOverlays(instance)

  return instance
}
