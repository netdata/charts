import Dygraph from "dygraphs"
import { format } from "date-fns"
import makeChartUI from "@/sdk/makeChartUI"
import executeLatest from "@/helpers/executeLatest"
import makeNavigation from "./navigation"
import makeHover from "./hover"
import makeHighlight from "./highlight"

const axisLabelFormatter = time => {
  const midnight = time.getSeconds() === 0 && time.getMinutes() === 0 && time.getHours() === 0
  return format(time, midnight ? "HH:mm:SS" : "MM:dd")
}

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let dygraph = null
  let listeners = []
  let navigation = null
  let hover = null
  let highlight = null

  const mount = element => {
    chartUI.mount(element)

    const attributes = chart.getAttributes()
    const payload = chart.getPayload()

    dygraph = new Dygraph(element, payload.result.data, {
      showLabelsOnHighlight: false,
      labels: payload.result.labels,
      axes: {
        x: {
          ticker: Dygraph.dateTicker,
          axisLabelFormatter,
        },
      },
      highlightCircleSize: 2,
      highlightSeriesOpts: {
        strokeWidth: 1,
        strokeBorderWidth: 1,
        highlightCircleSize: 3,
      },
      dateWindow: [attributes.after, attributes.before],
      highlightCallback: executeLatest((event, x, points, row, seriesName) =>
        chartUI.trigger("highlightCallback", event, x, points, row, seriesName)
      ),
      unhighlightCallback: executeLatest(() => chartUI.trigger("unhighlightCallback")),
      underlayCallback: (canvas, area, g) => chartUI.trigger("underlayCallback", canvas, area, g),
      interactionModel: {
        mousedown: executeLatest((...args) => chartUI.trigger("mousedown", ...args)),
        mousemove: executeLatest((...args) => chartUI.trigger("mousemove", ...args)),
        mouseup: executeLatest((...args) => chartUI.trigger("mouseup", ...args)),
        touchstart: executeLatest((...args) => chartUI.trigger("touchstart", ...args)),
        touchmove: executeLatest((...args) => chartUI.trigger("touchmove", ...args)),
        touchend: executeLatest((...args) => chartUI.trigger("touchend", ...args)),
        dblclick: executeLatest((...args) => chartUI.trigger("dblclick", ...args)),
      },
    })

    hover.toggle(attributes.enabledHover)
    navigation.set(attributes.navigation)

    listeners = [
      chart.onAttributeChange("hover", dimensions =>
        dygraph.setSelection(dimensions ? dimensions[0] : -1)
      ),
      chart.on("moveX", (after, before) => dygraph.updateOptions({ dateWindow: [after, before] })),
      chart.onAttributeChange("enabledHover", hover.toggle),
      chart.onAttributeChange("navigation", navigation.set),
      chart.onAttributeChange("highlight", highlight.toggle),
    ]
  }

  const unmount = () => {
    listeners.forEach(listener => listener())
    listeners = []
    chartUI.unmount()
    hover.destroy()
    highlight.destroy()
    navigation.destroy()
    dygraph.destroy()
    dygraph = null
  }

  const getDygraph = () => dygraph

  const instance = { ...chartUI, mount, unmount, getDygraph }

  navigation = makeNavigation(instance)
  hover = makeHover(instance)
  highlight = makeHighlight(instance)

  return instance
}
