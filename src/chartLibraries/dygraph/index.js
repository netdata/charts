import Dygraph from "dygraphs"
import makeChartUI from "@/sdk/makeChartUI"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"
import { isHeatmap } from "@/helpers/heatmap"
import {
  makeLinePlotter,
  makeStackedBarPlotter,
  makeMultiColumnBarPlotter,
  makeHeatmapPlotter,
  makeAnomalyPlotter,
  makeAnnotationsPlotter,
} from "./plotters"
import { numericTicker, heatmapTicker } from "./tickers"
import makeNavigation from "./navigation"
import makeHoverX from "./hoverX"
import makeOverlays from "./overlays"
import crosshair from "./crosshair"

const touchEvents = ["touchstart", "touchmove", "touchend"]

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let dygraph = null
  let listeners = []
  let navigation = null
  let hoverX = null
  let resizeObserver = null
  let overlays = null
  let executeLatest = null

  const mount = element => {
    if (dygraph) return

    chartUI.mount(element)

    const theme = chart.getAttribute("theme")
    element.classList.add(theme)

    const attributes = chart.getAttributes()
    const { data, labels } = chart.getPayload()

    executeLatest = makeExecuteLatest()

    const isEmpty = attributes.outOfLimits || data.length === 0

    dygraph = new Dygraph(element, isEmpty ? [[0]] : data, {
      // timingName: chart.getId(),
      legend: "never",
      showLabelsOnHighlight: false,
      labels: isEmpty ? ["X"] : labels,

      dateWindow: chart.getDateWindow(),
      clickCallback: executeLatest.add((...args) => chartUI.trigger("click", ...args)),
      highlightCallback: executeLatest.add((...args) =>
        chartUI.trigger("highlightCallback", ...args)
      ),
      unhighlightCallback: executeLatest.add(() => chartUI.trigger("unhighlightCallback")),
      drawCallback: (...args) => chartUI.trigger("drawCallback", ...args),
      underlayCallback: executeLatest.add((...args) =>
        chartUI.trigger("underlayCallback", ...args)
      ),
      interactionModel: {
        willDestroyContextMyself: true,
        mouseout: (...args) => chartUI.trigger("mouseout", ...args),
        mousedown: executeLatest.add((...args) => chartUI.trigger("mousedown", ...args)),
        mousemove: (...args) => chartUI.trigger("mousemove", ...args),
        mouseover: (...args) => chartUI.trigger("mouseover", ...args),
        mouseup: (...args) => chartUI.trigger("mouseup", ...args),
        touchstart: (...args) => chartUI.trigger("touchstart", ...args),
        touchmove: (...args) => chartUI.trigger("touchmove", ...args),
        touchend: (...args) => chartUI.trigger("touchend", ...args),
        dblclick: executeLatest.add((...args) => chartUI.trigger("dblclick", ...args)),
        wheel: (...args) => chartUI.trigger("wheel", ...args),
      },
      series: {
        ...(attributes.showAnomalies && {
          ANOMALY_RATE: {
            plotter: makeAnomalyPlotter(chartUI),
            drawPoints: false,
            pointSize: 0,
            highlightCircleSize: 0,
          },
        }),
        ...(attributes.showAnnotations && {
          ANNOTATIONS: {
            plotter: makeAnnotationsPlotter(chartUI),
            drawPoints: false,
            pointSize: 0,
            highlightCircleSize: 0,
          },
        }),
      },

      strokeBorderWidth: 0,
      axisLabelFontSize: attributes.axisLabelFontSize,
      axisLineWidth: 1,
      gridLineWidth: 1,
      maxNumberWidth: 8,
      highlightSeriesBackgroundAlpha: 1,
      drawGapEdgePoints: true,
      ylabel: chart.getAttribute("hasYlabel") && chart.getUnitSign({ long: true }),
      digitsAfterDecimal:
        chart.getAttribute("unitsConversionFractionDigits")[0] < 0
          ? 0
          : chart.getAttribute("unitsConversionFractionDigits")[0],
      yLabelWidth: 12,
      yRangePad: 15,
      labelsSeparateLines: true,
      rightGap: -5,

      ...makeChartTypeOptions(),
      ...makeThemingOptions(),
      ...makeVisibilityOptions(),
      ...makeDataOptions(),
      ...makeSparklineOptions(),
      ...makeColorOptions(),
    })

    resizeObserver = makeResizeObserver(
      element,
      () => chartUI.trigger("resize"),
      () => chartUI.trigger("resize")
    )

    touchEvents.forEach(eventType => {
      element.addEventListener(
        eventType,
        event => {
          event.preventDefault()
        },
        { passive: false }
      )
    })

    hoverX.toggle(attributes.enabledHover)
    navigation.toggle(attributes.enabledNavigation, attributes.navigation)

    listeners = [
      chartUI.on("resize", () => dygraph.resize()),
      chart.onAttributeChange("hoverX", dimensions => {
        const row = Array.isArray(dimensions) ? chart.getClosestRow(dimensions[0]) : -1

        if (row === -1) return dygraph.setSelection()

        crosshair(instance, row)
      }),
      chart.onAttributeChange("clickX", dimensions => {
        const row = Array.isArray(dimensions) ? chart.getClosestRow(dimensions[0]) : -1

        if (row === -1) return dygraph.setSelection()

        crosshair(instance, row, "click")
      }),
      chart.onAttributeChange("enabledHover", hoverX.toggle),
      chart.onAttributeChange("enabledNavigation", navigation.toggle),
      chart.onAttributeChange("navigation", navigation.set),
      chart.onAttributeChange("overlays", overlays.toggle),
      chart.onAttributeChange("draftAnnotation", overlays.toggle),
      chart.onAttributeChange("theme", (nextTheme, prevTheme) => {
        element.classList.remove(prevTheme)
        element.classList.add(nextTheme)
        dygraph.updateOptions(makeThemingOptions())
      }),
      chart.onAttributeChange("chartType", () => {
        if (chart.getAttribute("processing")) return

        dygraph.updateOptions(makeChartTypeOptions())
      }),
      chart.onAttributeChange("selectedLegendDimensions", () => {
        if (chart.getAttribute("processing")) return

        dygraph.updateOptions({
          ...makeVisibilityOptions(),
          ...makeColorOptions(),
          ...makeChartTypeOptions(),
          digitsAfterDecimal:
            chart.getAttribute("unitsConversionFractionDigits")[0] < 0
              ? 0
              : chart.getAttribute("unitsConversionFractionDigits")[0],
        })
      }),
      chart.onAttributeChange("staticValueRange", staticValueRange => {
        if (!staticValueRange) {
          dygraph.updateOptions({
            valueRange: attributes.getValueRange(chart, { dygraph: true }),
          })
          return
        }

        const [min, max] = staticValueRange
        dygraph.updateOptions({
          valueRange: isHeatmap(attributes.chartType)
            ? [Math.ceil(min), Math.ceil(max)]
            : attributes.getValueRange(chart, { dygraph: true }),
        })
      }),
      chart.onAttributeChange("timezone", () => dygraph.updateOptions({})),
    ].filter(Boolean)

    overlays.toggle()

    chartUI.render()
  }

  const plotterByChartType = {
    line: makeLinePlotter(chartUI),
    stackedBar: makeStackedBarPlotter(chartUI),
    multiBar: makeMultiColumnBarPlotter(chartUI),
    heatmap: makeHeatmapPlotter(chartUI),
    default: null,
  }

  let prevMin
  let prevMax

  const defaultOptions = {
    yRangePad: 15,
    strokeWidth: 0.7,
    fillAlpha: 0.2,
    fillGraph: false,
    stackedGraph: false,
    forceIncludeZero: false,
    errorBars: false,
    makeYAxisLabelFormatter: () => (y, granularity, opts, d) => {
      const dataMin = chart.getAttribute("min")
      const dataMax = chart.getAttribute("max")

      let [min, max] = d.axes_[0].valueRange || [null, null]
      min = min === null ? dataMin : min
      max = max === null ? dataMax : max

      if (min !== prevMin || max !== prevMax) {
        prevMin = min
        prevMax = max
        chart.trigger("yAxisChange", min, max)
      }
      return chart.getConvertedValue(y) // TODO Pass { dimensionId: context.id } when multiple contexts with different units
    },
    makeYTicker:
      (options = {}) =>
      (a, b, pixels, opts, dygraph, vals) =>
        numericTicker(a, b, pixels, opts, dygraph, vals, options),
    highlightCircleSize: 4,
  }

  const optionsByChartType = {
    line: {
      ...defaultOptions,
      strokeWidth: 1.5,
      fillAlpha: 0.2,
    },
    stacked: {
      ...defaultOptions,
      strokeWidth: 0.1,
      fillAlpha: 0.8,
      fillGraph: true,
      stackedGraph: true,
      forceIncludeZero: true,
    },
    area: {
      ...defaultOptions,
      fillGraph: true,
      forceIncludeZero: true,
    },
    stackedBar: {
      ...defaultOptions,
      stackedGraph: true,
      forceIncludeZero: true,
    },
    heatmap: {
      ...defaultOptions,
      makeYAxisLabelFormatter: () => y => {
        const min = chart.getAttribute("min")
        const max = chart.getAttribute("max")

        if (min !== prevMin || max !== prevMax) {
          prevMin = min
          prevMax = max
          chart.trigger("yAxisChange", min, max)
        }
        const value = parseFloat(parseFloat(y).toFixed(5))
        return isNaN(value) ? y : value
      },
      makeYTicker:
        (options = {}) =>
        (a, b, pixels, opts, dygraph, vals) =>
          heatmapTicker(a, b, pixels, opts, dygraph, vals, options),
      highlightCircleSize: 0,
    },
    default: {
      ...defaultOptions,
    },
  }

  const makeChartTypeOptions = () => {
    const { labels } = chart.getPayload()
    const { chartType, includeZero, enabledXAxis, enabledYAxis, yAxisLabelWidth } =
      chart.getAttributes()

    const plotter = plotterByChartType[chartType] || plotterByChartType.default

    const {
      strokeWidth,
      fillAlpha,
      fillGraph,
      stackedGraph,
      forceIncludeZero,
      makeYAxisLabelFormatter,
      errorBars,
      makeYTicker,
      highlightCircleSize,
      yRangePad,
    } = optionsByChartType[chartType] || optionsByChartType.default

    const yAxisLabelFormatter = makeYAxisLabelFormatter(labels)
    const yTicker = makeYTicker
      ? makeYTicker({ labels: chart.getVisibleDimensionIds(), units: chart.getUnits() })
      : null

    const { selectedLegendDimensions } = chart.getAttributes()
    const dimensionIds = chart.getPayloadDimensionIds()

    return {
      yRangePad,
      stackedGraph,
      fillGraph,
      fillAlpha,
      highlightCircleSize,
      strokeWidth,
      includeZero:
        includeZero ||
        (forceIncludeZero && dimensionIds.length > 1 && selectedLegendDimensions.length > 1),
      stackedGraphNaNFill: "none",
      plotter,
      errorBars,
      axes: {
        x: enabledXAxis
          ? {
              ticker: Dygraph.dateTicker,
              axisLabelFormatter: chart.formatXAxis,
              axisLabelWidth: 60,
            }
          : { drawAxis: false },
        y: enabledYAxis
          ? {
              ...(yTicker && { ticker: yTicker }),
              axisLabelFormatter: yAxisLabelFormatter,
              ...(yAxisLabelWidth && { axisLabelWidth: yAxisLabelWidth }),
              pixelsPerLabel: 15,
            }
          : { drawAxis: false },
      },
      ylabel:
        chart.getAttribute("hasYlabel") &&
        chart.getUnitSign({ long: true, withoutConversion: isHeatmap(chartType) }),
    }
  }

  const makeThemingOptions = () => {
    const themeGridColor = chartUI.chart.getThemeAttribute("themeGridColor")
    return { axisLineColor: themeGridColor, gridLineColor: themeGridColor }
  }

  const makeVisibilityOptions = () => {
    const dimensionIds = chart.getPayloadDimensionIds()
    const payloadDimensions = chart.getPayload().labels
    if (!dimensionIds?.length || !payloadDimensions?.length) return { visibility: false }

    const arrayLength = payloadDimensions.length - dimensionIds.length

    const suffixLabels = Array(arrayLength > 0 ? arrayLength : 0).fill(true)
    const selectedLegendDimensions = chart.getAttribute("selectedLegendDimensions")

    const visibility = [
      ...dimensionIds.map(selectedLegendDimensions.length ? chart.isDimensionVisible : () => true),
      ...suffixLabels,
    ]

    return { visibility }
  }

  const makeDataOptions = () => {
    const { outOfLimits, getValueRange, staticValueRange, chartType } = chart.getAttributes()
    const { data, labels } = chart.getPayload()
    const dateWindow = chart.getDateWindow()
    const isEmpty = outOfLimits || data.length === 0

    return {
      file: isEmpty ? [[0]] : data,
      labels: isEmpty ? ["X"] : labels,
      dateWindow,
      valueRange: staticValueRange
        ? staticValueRange
        : isHeatmap(chartType)
          ? [0, chart.getVisibleDimensionIds().length]
          : getValueRange(chart, { dygraph: true }),
    }
  }

  const makeSparklineOptions = () => {
    if (!chart.isSparkline()) return null

    return {
      drawGrid: false,
      drawAxis: false,
      ylabel: undefined,
      yLabelWidth: 0,
      highlightCircleSize: 3,
      fillAlpha: 1,
      strokeWidth: 0,
    }
  }

  const makeColorOptions = () => {
    const dimensionIds = chart.getPayloadDimensionIds()

    if (!dimensionIds.length) return {}
    const colors = dimensionIds.map(id => chart.selectDimensionColor(id))

    return { colors }
  }

  const unmount = () => {
    if (!dygraph) return

    if (executeLatest) executeLatest.clear()

    resizeObserver()
    listeners.forEach(listener => listener())
    listeners = []
    chartUI.unmount()
    hoverX.destroy()
    navigation.destroy()
    dygraph.destroy()
    dygraph = null
    overlays.destroy()
  }

  const getDygraph = () => dygraph

  const render = () => {
    if (!dygraph) return

    const { highlighting, panning, processing } = chart.getAttributes()
    if (highlighting || panning || processing) return

    chartUI.render()

    dygraph.updateOptions({
      ...makeDataOptions(),
      ...makeVisibilityOptions(),
      ...makeColorOptions(),
      ...makeChartTypeOptions(),
      digitsAfterDecimal:
        chart.getAttribute("unitsConversionFractionDigits")[0] < 0
          ? 0
          : chart.getAttribute("unitsConversionFractionDigits")[0],
      ...makeSparklineOptions(),
    })

    chartUI.trigger("rendered")
  }

  const getPreceded = () => {
    if (!dygraph) return -1

    const firstEntryMs = chart.getFirstEntry() * 1000
    const [after] = dygraph.xAxisRange()

    if (firstEntryMs < after) return -1

    const [afterExtreme] = dygraph.xAxisExtremes()
    return dygraph.toDomXCoord(afterExtreme)
  }

  const getChartWidth = () => (dygraph ? dygraph.getArea().w : chartUI.getChartWidth())
  const getChartHeight = () => (dygraph ? dygraph.getArea().h : 100)

  const getXAxisRange = () => dygraph?.xAxisRange()

  const instance = {
    ...chartUI,
    getChartWidth,
    getChartHeight,
    getPreceded,
    mount,
    unmount,
    getDygraph,
    getXAxisRange,
    render,
  }

  navigation = makeNavigation(instance)
  hoverX = makeHoverX(instance)
  overlays = makeOverlays(instance)

  return instance
}
