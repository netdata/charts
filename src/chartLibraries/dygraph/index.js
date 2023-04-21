import Dygraph from "dygraphs"
import makeChartUI from "@/sdk/makeChartUI"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import {
  makeLinePlotter,
  makeStackedBarPlotter,
  makeMultiColumnBarPlotter,
  makeHeatmapPlotter,
  makeAnomalyPlotter,
  makeAnnotationsPlotter,
} from "./plotters"
import { numericTicker } from "./tickers"
import makeNavigation from "./navigation"
import makeHoverX from "./hoverX"
import makeOverlays from "./overlays"
import crosshair from "./crosshair"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let dygraph = null
  let listeners = []
  let navigation = null
  let hoverX = null
  let overlays = null
  let resizeObserver = null
  let executeLatest

  const makeNormalizeByChartType = {
    default: d => d,
    heatmap: matrix => matrix.map(r => r.map((c, i) => (i === 0 ? c : [c, i, c]))),
  }

  const normalizeData = data => {
    const chartType = chart.getAttribute("chartType")
    const normalize = makeNormalizeByChartType[chartType] || makeNormalizeByChartType.default

    return normalize(data)
  }

  const mount = element => {
    if (dygraph) return

    chartUI.mount(element)

    const theme = chart.getAttribute("theme")
    element.classList.add(theme)

    const attributes = chart.getAttributes()
    const { data, labels } = chart.getPayload()

    executeLatest = makeExecuteLatest()
    const isEmpty = attributes.outOfLimits || data.length === 0

    dygraph = new Dygraph(element, isEmpty ? [[0]] : normalizeData(data), {
      // timingName: "TEST",
      legend: "never",
      showLabelsOnHighlight: false,
      labels: isEmpty ? ["X"] : labels,

      dateWindow: chart.getDateWindow(),
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
      series: {
        ANOMALY_RATE: {
          plotter: makeAnomalyPlotter(chartUI),
          drawPoints: false,
          pointSize: 0,
          highlightCircleSize: 0,
        },
        ANNOTATIONS: {
          plotter: makeAnnotationsPlotter(chartUI),
          drawPoints: false,
          pointSize: 0,
          highlightCircleSize: 0,
        },
      },

      strokeBorderWidth: 0,
      axisLabelFontSize: attributes.axisLabelFontSize,
      axisLineWidth: 1,
      gridLineWidth: 1,
      maxNumberWidth: 8,
      highlightSeriesBackgroundAlpha: 1,
      drawGapEdgePoints: true,
      ylabel: chart.getAttribute("hasYlabel") && chart.getUnitSign({ long: true }),
      digitsAfterDecimal: chart.getAttribute("unitsConversionFractionDigits"),
      yLabelWidth: 12,
      yRangePad: 30,
      labelsSeparateLines: true,
      rightGap: -5,

      ...makeChartTypeOptions(),
      ...makeThemingOptions(),
      ...makeVisibilityOptions(),
      ...makeDataOptions(),
      ...makeSparklineOptions(),
      ...makeColorOptions(),
    })

    resizeObserver = makeResizeObserver(element, () => {
      chartUI.trigger("resize")
    })

    hoverX.toggle(attributes.enabledHover)
    navigation.toggle(attributes.enabledNavigation, attributes.navigation)
    const latestRender = executeLatest.add(render)

    listeners = [
      chartUI.on(
        "resize",
        executeLatest.add(() => dygraph.resize())
      ),
      chart.onAttributeChange(
        "hoverX",
        executeLatest.add(dimensions => {
          const row = dimensions ? chart.getClosestRow(dimensions[0]) : -1

          if (row === -1) return dygraph.setSelection()

          crosshair(instance, row)
        })
      ),
      chart.onAttributeChange("after", latestRender),
      chart.onAttributeChange("chartType", latestRender),
      chart.onAttributeChange("enabledHover", hoverX.toggle),
      chart.onAttributeChange("enabledNavigation", navigation.toggle),
      chart.onAttributeChange("navigation", navigation.set),
      chart.onAttributeChange("overlays", overlays.toggle),
      chart.onAttributeChange("theme", (nextTheme, prevTheme) => {
        element.classList.remove(prevTheme)
        element.classList.add(nextTheme)
        dygraph.updateOptions(makeThemingOptions())
      }),
      chart.onAttributeChange("chartType", () => dygraph.updateOptions(makeChartTypeOptions())),
      chart.onAttributeChange("selectedLegendDimensions", () =>
        dygraph.updateOptions({
          ...makeVisibilityOptions(),
          ...makeColorOptions(),
          ...makeChartTypeOptions(),
          ylabel: chart.getAttribute("hasYlabel") && chart.getUnitSign({ long: true }),
          digitsAfterDecimal: chart.getAttribute("unitsConversionFractionDigits"),
        })
      ),
      chart.onAttributeChange("unitsConversion", () =>
        dygraph.updateOptions({
          ylabel: chart.getAttribute("hasYlabel") && chart.getUnitSign({ long: true }),
          digitsAfterDecimal: chart.getAttribute("unitsConversionFractionDigits"),
        })
      ),
      chart.onAttributeChange("valueRange", valueRange => {
        dygraph.updateOptions({
          valueRange:
            attributes.chartType === "heatmap"
              ? [
                  0,
                  attributes.selectedLegendDimensions.length
                    ? attributes.selectedLegendDimensions.length
                    : labels.length,
                ]
              : attributes.getValueRange({
                  min: attributes.min,
                  max: attributes.max,
                  valueRange,
                }),
        })
      }),
      chart.onAttributeChange("timezone", () => dygraph.updateOptions({})),
    ].filter(Boolean)

    overlays.toggle()

    chartUI.trigger("resize")
    chartUI.render()
    chartUI.trigger("rendered")
  }

  const makePlotterByChartType = ({ sparkline }) => ({
    line: sparkline ? null : makeLinePlotter(chartUI),
    stackedBar: makeStackedBarPlotter(chartUI),
    multibar: makeMultiColumnBarPlotter(chartUI),
    heatmap: makeHeatmapPlotter(chartUI),
    default: null,
  })

  let prevMin
  let prevMax

  const defaultOptions = {
    strokeWidth: 0.7,
    fillAlpha: 0.2,
    fillGraph: false,
    stackedGraph: false,
    forceIncludeZero: false,
    errorBars: false,
    makeYAxisLabelFormatter: () => (y, granularity, opts, d) => {
      const extremes = d.axes_[0].extremeRange
      let [min, max] = d.axes_[0].valueRange || [null, null]
      min = min === null ? extremes[0] : min
      max = max === null ? extremes[1] : max

      if (min !== prevMin || max !== prevMax) {
        prevMin = min
        prevMax = max
        chartUI.sdk.trigger("yAxisChange", chart, min, max)
      }
      return chart.getConvertedValue(y)
    },
    yTicker: numericTicker,
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
      makeYAxisLabelFormatter: labels => y => y === 0 ? null : chart.getDimensionName(labels[y]),
      yTicker: (a, b, pixels, opts, dygraph) => {
        return dygraph.attributes_.user_.labels.reduce((h, label, i) => {
          if (i === 0) return h
          if (!dygraph.attributes_.user_.visibility[i]) return h
          const l = opts("axisLabelFormatter")(i, 0, opts, dygraph)
          h.push({ label_v: i, label: l })
          return h
        }, [])
      },
      errorBars: true,
    },
    default: {
      ...defaultOptions,
    },
  }

  const makeChartTypeOptions = () => {
    const { labels } = chart.getPayload()
    const { chartType, sparkline, includeZero, enabledXAxis, enabledYAxis, yAxisLabelWidth } =
      chart.getAttributes()

    const plotterByChartType = makePlotterByChartType({ sparkline })
    const plotter = plotterByChartType[chartType] || plotterByChartType.default

    const {
      strokeWidth,
      fillAlpha,
      fillGraph,
      stackedGraph,
      forceIncludeZero,
      makeYAxisLabelFormatter,
      errorBars,
      yTicker,
    } = optionsByChartType[chartType] || optionsByChartType.default

    const yAxisLabelFormatter = makeYAxisLabelFormatter(labels)

    const { selectedLegendDimensions } = chart.getAttributes()
    const dimensionIds = chart.getPayloadDimensionIds()

    return {
      stackedGraph,
      fillGraph,
      fillAlpha: sparkline ? 1 : fillAlpha,
      highlightCircleSize: sparkline ? 3 : 4,
      strokeWidth: sparkline ? 0 : strokeWidth,
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
    }
  }

  const makeThemingOptions = () => {
    const themeGridColor = chartUI.chart.getThemeAttribute("themeGridColor")
    return { axisLineColor: themeGridColor, gridLineColor: themeGridColor }
  }

  const makeVisibilityOptions = () => {
    const dimensionIds = chart.getPayloadDimensionIds()
    if (!dimensionIds.length) return { visibility: false }

    const selectedLegendDimensions = chart.getAttribute("selectedLegendDimensions")

    const suffixLabels = Array(chart.getPayload().labels.length - dimensionIds.length).fill(true)

    const visibility = [
      ...dimensionIds.map(selectedLegendDimensions.length ? chart.isDimensionVisible : () => true),
      ...suffixLabels,
    ]

    return { visibility }
  }

  const makeDataOptions = () => {
    const {
      valueRange,
      outOfLimits,
      getValueRange,
      chartType,
      selectedLegendDimensions,
      min,
      max,
    } = chart.getAttributes()
    const { data, labels } = chart.getPayload()
    const dateWindow = chart.getDateWindow()
    const isEmpty = outOfLimits || data.length === 0

    return {
      file: isEmpty ? [[0]] : normalizeData(data),
      labels: isEmpty ? ["X"] : labels,
      dateWindow,
      valueRange:
        chartType === "heatmap"
          ? [0, selectedLegendDimensions.length ? selectedLegendDimensions.length : labels.length]
          : getValueRange({
              min,
              max,
              valueRange,
            }),
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

  const makeColorOptions = () => {
    const dimensionIds = chart.getPayloadDimensionIds()

    if (!dimensionIds.length) return {}
    const colors = dimensionIds.map(chart.selectDimensionColor)

    return { colors }
  }

  const unmount = () => {
    if (!dygraph) return

    resizeObserver()
    if (executeLatest) executeLatest.clear()
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

    const { highlighting, panning } = chart.getAttributes()
    if (highlighting || panning) return

    chartUI.render()

    dygraph.updateOptions({
      ...makeDataOptions(),
      ...makeVisibilityOptions(),
      ...makeColorOptions(),
      ylabel: chart.getAttribute("hasYlabel") && chart.getUnitSign({ long: true }),
      digitsAfterDecimal: chart.getAttribute("unitsConversionFractionDigits"),
    })
  }

  const getPreceded = () => {
    if (!dygraph) return -1

    const firstEntryMs = chartUI.chart.getFirstEntry() * 1000
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
