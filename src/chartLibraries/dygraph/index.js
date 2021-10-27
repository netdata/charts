import Dygraph from "dygraphs"
import "dygraphs/src/extras/smooth-plotter"
import makeChartUI from "@/sdk/makeChartUI"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import makeNavigation from "./navigation"
import makeHover from "./hover"
import makeHoverX from "./hoverX"
import makeOverlays from "./overlays"
import crosshair from "./crosshair"

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
  let executeLatest

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

    executeLatest = makeExecuteLatest()

    dygraph = new Dygraph(element, payload.result.data, {
      showLabelsOnHighlight: false,
      labels: payload.result.labels,
      axes: {
        x: {
          ticker: Dygraph.dateTicker,
          axisLabelFormatter: date => chart.formatXAxis(date),
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
      highlightCallback: executeLatest.add((event, x, points, row, seriesName) =>
        chartUI.trigger("highlightCallback", event, x, points, row, seriesName)
      ),
      unhighlightCallback: executeLatest.add(() => chartUI.trigger("unhighlightCallback")),
      drawCallback: (...args) => chartUI.trigger("drawCallback", ...args),
      underlayCallback: executeLatest.add((...args) =>
        chartUI.trigger("underlayCallback", ...args)
      ),
      interactionModel: {
        willDestroyContextMyself: true,
        mouseout: executeLatest.add((...args) => chartUI.trigger("mouseout", ...args)),
        mousedown: executeLatest.add((...args) => chartUI.trigger("mousedown", ...args)),
        mousemove: executeLatest.add((...args) => chartUI.trigger("mousemove", ...args)),
        mouseover: executeLatest.add((...args) => chartUI.trigger("mouseover", ...args)),
        mouseup: executeLatest.add((...args) => chartUI.trigger("mouseup", ...args)),
        touchstart: executeLatest.add((...args) => chartUI.trigger("touchstart", ...args)),
        touchmove: executeLatest.add((...args) => chartUI.trigger("touchmove", ...args)),
        touchend: executeLatest.add((...args) => chartUI.trigger("touchend", ...args)),
        dblclick: executeLatest.add((...args) => chartUI.trigger("dblclick", ...args)),
        wheel: executeLatest.add((...args) => chartUI.trigger("wheel", ...args)),
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
      rightGap: -6,
      colors: chart.getColors(),
      valueRange: attributes.valueRange,
      ...makeChartTypeOptions(),
      ...makeThemingOptions(),
      ...makeVisibilityOptions(),
      ...makeDataOptions(),
      ...makeSparklineOptions(),
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

    resizeObserver = makeResizeObserver(element, () => {
      chartUI.trigger("resize")
    })

    hoverX.toggle(attributes.enabledHover)
    navigation.set(attributes.navigation)

    listeners = [
      chartUI.on(
        "resize",
        executeLatest.add(() => dygraph.resize())
      ),
      chart.onAttributeChange(
        "hoverX",
        executeLatest.add(dimensions => {
          const nextSelection = dimensions ? chart.getClosestRow(dimensions[0]) : -1

          if (nextSelection === -1) return dygraph.setSelection()

          const selection = getDygraphSelection(nextSelection)
          dygraph.setSelection(selection)

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
      chart.onAttributeChange("timezone", () => {
        dygraph.updateOptions({})
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
    const sparkline = chart.getAttribute("sparkline")

    const smooth = line && !sparkline

    const strokeWidth = stacked ? 0.1 : smooth ? 1.5 : 0.7

    return {
      stackedGraph: stacked,
      fillGraph: stacked || area,
      fillAlpha: stacked ? 0.8 : 0.2,
      highlightCircleSize: sparkline ? 3 : 4,
      strokeWidth,
      includeZero: stacked,
      plotter: (smooth && window.smoothPlotter) || null,
    }
  }

  const makeThemingOptions = () => {
    const themeGridColor = chartUI.getThemeAttribute("themeGridColor")
    return { axisLineColor: themeGridColor, gridLineColor: themeGridColor }
  }

  const makeVisibilityOptions = () => {
    const selectedDimensions = chart.getAttribute("selectedDimensions")
    const { dimensionIds } = chart.getPayload()

    const visibility = dimensionIds.map(selectedDimensions ? chart.isDimensionVisible : () => true)

    return { visibility }
  }

  const makeDataOptions = () => {
    const { valueRange } = chart.getAttributes()
    const { result, min, max } = chart.getPayload()
    const dateWindow = getDateWindow(chart)

    return {
      file: result.data,
      labels: result.labels,
      dateWindow,
      valueRange: valueRange || (min === max ? [0, max * 2] : null),
    }
  }

  const makeSparklineOptions = () => {
    const sparkline = chart.getAttribute("sparkline")

    if (!sparkline) return null

    return {
      drawGrid: false,
      drawAxis: false,
      title: undefined,
      ylabel: undefined,
      yLabelWidth: 0,
      labelsSeparateLines: true,
      yRangePad: 1,
      axis: {
        x: {
          drawGrid: false,
          drawAxis: false,
        },
        y: {
          drawGrid: false,
          drawAxis: false,
        },
      },
    }
  }

  const unmount = () => {
    if (!dygraph) return

    resizeObserver()
    if (executeLatest) executeLatest.clear()
    listeners.forEach(listener => listener())
    listeners = []
    chartUI.unmount()
    hover()
    hoverX.destroy()
    navigation.destroy()
    dygraph.destroy()
    dygraph = null
    overlays.destroy()
  }

  const getDygraph = () => dygraph

  const render = () => {
    if (!dygraph) return

    const { highlighting, panning } = chart.getAttributes()
    if (highlighting || panning) return

    chartUI.render()

    chart.updateDimensions()
    dygraph.updateOptions({
      ...makeDataOptions(),
      ...makeVisibilityOptions(),
      colors: chart.getColors(),
    })
    chartUI.trigger("rendered")
  }

  const getDygraphSelection = nextSelection => {
    if (
      dygraph.layout_.points[0][nextSelection]?.xval ===
      chart.getPayload().result.data[nextSelection][0]
    ) {
      return nextSelection
    }

    const [timestamp] = chart.getPayload().result.data[nextSelection]
    const canvasx = dygraph.toDomXCoord(timestamp)
    return dygraph.findClosestRow(canvasx)
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
