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
import makeHover from "./hover"
import makeHoverX from "./hoverX"
import makeOverlays from "./overlays"
import crosshair from "./crosshair"
import drawAnnotations from "./drawAnnotations"

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

    chart.consumePayload()
    chart.updateDimensions()
    const attributes = chart.getAttributes()
    const { result, min, max } = chart.getPayload()

    executeLatest = makeExecuteLatest()
    const isEmpty = attributes.outOfLimits || result.data.length === 0

    dygraph = new Dygraph(element, isEmpty ? [[0]] : normalizeData(result.data), {
      // timingName: "TEST",
      legend: "never",
      showLabelsOnHighlight: false,
      labels: isEmpty ? ["X"] : result.labels,

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
      // ylabel: attributes.unit,
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
          const nextSelection = dimensions ? chart.getClosestRow(dimensions[0]) : -1

          if (nextSelection === -1) return dygraph.setSelection()

          dygraph.setSelection(nextSelection)

          crosshair(instance, nextSelection)
        })
      ),
      chart.onAttributeChange("after", latestRender),
      chart.onAttributeChange("chartType", latestRender),
      chart.onAttributeChange("enabledHover", hoverX.toggle),
      chart.onAttributeChange("enabledNavigation", navigation.toggle),
      chart.onAttributeChange("navigation", navigation.set),
      chart.onAttributeChange("overlays", overlays.toggle),
      chart.onAttributeChange("annotations", () => drawAnnotations(dygraph, chartUI)),
      chart.onAttributeChange("theme", (nextTheme, prevTheme) => {
        element.classList.remove(prevTheme)
        element.classList.add(nextTheme)
        dygraph.updateOptions(makeThemingOptions())
      }),
      chart.onAttributeChange("chartType", () => dygraph.updateOptions(makeChartTypeOptions())),
      chart.onAttributeChange("selectedLegendDimensions", () => {
        dygraph.updateOptions({
          ...makeVisibilityOptions(),
          ...makeColorOptions(),
          ...makeChartTypeOptions(),
        })
      }),
      chart.onAttributeChange("valueRange", valueRange => {
        dygraph.updateOptions({
          valueRange:
            attributes.chartType === "heatmap"
              ? [
                  0,
                  attributes.selectedLegendDimensions.length
                    ? attributes.selectedLegendDimensions.length
                    : result.labels.length,
                ]
              : attributes.getValueRange({
                  min,
                  max,
                  groupBy: attributes.groupBy,
                  valueRange,
                  aggrMethod: attributes.aggregationMethod,
                }),
        })
      }),
      chart.onAttributeChange("timezone", () => {
        dygraph.updateOptions({})
      }),
    ].filter(Boolean)

    hover = makeHover(instance)
    overlays.toggle()
    drawAnnotations(dygraph, chartUI)

    chartUI.render()
    chartUI.trigger("rendered")
  }

  const makePlotterByChartType = ({ sparkline }) => ({
    line: sparkline ? null : makeLinePlotter(chartUI),
    stackedBar: makeStackedBarPlotter(chartUI),
    multibar: makeMultiColumnBarPlotter(chartUI),
    heatmap: makeHeatmapPlotter(chartUI),
    default: Dygraph.Plotters.fillPlotter,
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
      const [min, max] = d.axes_[0].extremeRange

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
    },
    stackedBar: {
      ...defaultOptions,
      stackedGraph: true,
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
    const { result } = chart.getPayload()
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

    const { selectedLegendDimensions } = chart.getAttributes()
    const dimensionIds = chart.getPayloadDimensionIds()

    const yAxisLabelFormatter = makeYAxisLabelFormatter(result.labels)

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
    const themeGridColor = chartUI.getThemeAttribute("themeGridColor")
    return { axisLineColor: themeGridColor, gridLineColor: themeGridColor }
  }

  const makeVisibilityOptions = () => {
    const dimensionIds = chart.getPayloadDimensionIds()
    if (!dimensionIds.length) return { visibility: false }

    const selectedLegendDimensions = chart.getAttribute("selectedLegendDimensions")

    const suffixLabels = Array(chart.getPayload().result.labels.length - dimensionIds.length).fill(
      true
    )

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
      aggregationMethod,
      chartType,
      selectedLegendDimensions,
    } = chart.getAttributes()
    const { result, min, max } = chart.getPayload()
    const dateWindow = getDateWindow(chart)
    const isEmpty = outOfLimits || result.data.length === 0

    const groupBy = chart.getAttribute("groupBy")

    return {
      file: isEmpty ? [[0]] : normalizeData(result.data),
      labels: isEmpty ? ["X"] : result.labels,
      dateWindow,
      valueRange:
        chartType === "heatmap"
          ? [
              0,
              selectedLegendDimensions.length
                ? selectedLegendDimensions.length
                : result.labels.length,
            ]
          : getValueRange({
              min,
              max,
              groupBy,
              valueRange,
              aggrMethod: aggregationMethod,
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
    const sparkline = chart.getAttribute("sparkline")
    if (sparkline) return { colors: chart.getColors() }

    const dimensionIds = chart.getPayloadDimensionIds()

    if (!dimensionIds.length) return {}
    const colors = dimensionIds.map(id => chart.selectDimensionColor(id))

    return { colors }
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

    chart.consumePayload()

    chart.updateDimensions()

    dygraph.updateOptions({
      ...makeDataOptions(),
      ...makeVisibilityOptions(),
      ...makeColorOptions(),
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

  const getEstimatedChartWidth = () => {
    const width = chartUI.getEstimatedWidth()
    const legendWidth = chart.getAttribute("legend") ? 140 : 0
    return width - legendWidth
  }

  const getChartWidth = () => (dygraph ? dygraph.getArea().w : chartUI.getEstimatedChartWidth())
  const getChartHeight = () => (dygraph ? dygraph.getArea().h : 100)

  const getXAxisRange = () => dygraph?.xAxisRange()

  const instance = {
    ...chartUI,
    getEstimatedChartWidth,
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
