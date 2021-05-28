import Dygraph from "dygraphs"
import { format } from "date-fns"
import makeChartUI from "@/sdk/makeChartUI"
import executeLatest from "@/helpers/executeLatest"
import makeNavigation from "./navigation"
import makeHover from "./hover"
import makeHoverX from "./hoverX"
import makeHighlight from "./highlight"

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
    chartUI.mount(element)

    const attributes = chart.getAttributes()
    const payload = chart.getPayload()
    const { chartType } = chart.getMetadata()
    const stacked = chartType === "stacked"
    const area = chartType === "area"
    const line = chartType === "line"
    const sparkline = false
    const logScale = false
    console.log(chart.getMetadata())
    const smooth = line && !sparkline

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

      highlightSeriesOpts: {
        //   strokeWidth: 1,
        strokeBorderWidth: 1,
        //   highlightCircleSize: 3,
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
      strokeBorderColor: "#FFFFFF",
      strokeBorderWidth: 0,
      stackedGraph: stacked,
      fillGraph: stacked || area,
      fillAlpha: stacked ? 0.8 : 0.2,
      axisLabelFontSize: 10,
      axisLineColor: "#F0F0F0",
      axisLineWidth: 1,
      gridLineWidth: 1,
      gridLineColor: "#F0F0F0",
      maxNumberWidth: 8,
      highlightCircleSize: sparkline ? 3 : 4,
      highlightSeriesBackgroundAlpha: null,
      strokeWidth: stacked ? 0.1 : smooth ? 1.5 : 0.7,
      drawGapEdgePoints: true,
      ylabel: attributes.unit,
      yLabelWidth: 12,
      yRangePad: 1,
      includeZero: stacked,
      labelsSeparateLines: true,
      colors: [
        "#3366CC",
        "#DC3912",
        "#109618",
        "#FF9900",
        "#990099",
        "#DD4477",
        "#3B3EAC",
        "#66AA00",
        "#0099C6",
        "#B82E2E",
        "#AAAA11",
        "#5574A6",
        "#994499",
        "#22AA99",
        "#6633CC",
        "#E67300",
        "#316395",
        "#8B0707",
        "#329262",
        "#3B3EAC",
      ],
      // visibility return selected dimensions
      // logscale
    })

    hoverX.toggle(attributes.enabledHover)
    navigation.set(attributes.navigation)

    listeners = [
      chart.onAttributeChange("hoverX", dimensions =>
        dygraph.setSelection(dimensions ? dimensions[0] : -1)
      ),
      chart.on("moveX", (after, before) =>
        dygraph.updateOptions({ dateWindow: [after * 1000, before * 1000] })
      ),
      chart.onAttributeChange("enabledHover", hoverX.toggle),
      chart.onAttributeChange("navigation", navigation.set),
      chart.onAttributeChange("highlight", highlight.toggle),
      chart.on("successFetch", payload => {
        const dateWindow = getDateWindow(chart)
        dygraph.updateOptions({
          file: payload.result.data,
          labels: payload.result.labels,
          dateWindow,
        })
      }),
    ]

    hover = makeHover(instance)
  }

  const unmount = () => {
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

  const instance = { ...chartUI, mount, unmount, getDygraph }

  navigation = makeNavigation(instance)
  hoverX = makeHoverX(instance)
  highlight = makeHighlight(instance)

  return instance
}
