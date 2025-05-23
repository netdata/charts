import Dygraph from "dygraphs"
import { debounce } from "throttle-debounce"
import limitRange from "@/helpers/limitRange"
import makeHoverX from "../hoverX"

const doubleTapDelay = 300

export default chartUI => {
  const { destroy } = makeHoverX(chartUI)

  const updateNavigation = (
    navigation,
    prevNavigation = chartUI.chart.getAttribute("navigation")
  ) =>
    chartUI.chart.updateAttributes({
      navigation,
      prevNavigation,
    })

  const mousedown = event => {
    if (event.shiftKey && event.altKey) {
      updateNavigation("selectVertical")
      return
    }
    if (event.altKey) {
      updateNavigation("highlight")
      return
    }
    if (event.shiftKey) {
      updateNavigation("select")
      return
    }
  }

  const mouseup = () => {
    setTimeout(() => {
      const navigation = chartUI.chart.getAttribute("prevNavigation")
      if (navigation) updateNavigation(navigation, null)
    })
  }

  const moveXDebounced = debounce(500, (chart, fixedAfter, fixedBefore) => {
    chart.moveX(fixedAfter, fixedBefore)
  })

  const onZoom = (event, dygraph) => {
    if (!event.shiftKey && !event.altKey) return

    event.preventDefault()
    event.stopPropagation()

    const zoom = (g, zoomInPercentage, bias) => {
      bias = bias || 0.5
      const [afterAxis, beforeAxis] = g.xAxisRange()

      const delta = beforeAxis - afterAxis
      const increment = delta * zoomInPercentage
      const [afterIncrement, beforeIncrement] = [increment * bias, increment * (1 - bias)]

      const afterSeconds = Math.round((afterAxis + afterIncrement) / 1000)
      const beforeSeconds = Math.round((beforeAxis - beforeIncrement) / 1000)

      const { fixedAfter, fixedBefore } = limitRange({
        after: afterSeconds,
        before: beforeSeconds,
      })
      if (fixedAfter * 1000 === afterAxis && fixedBefore * 1000 === beforeAxis) {
        return
      }

      moveXDebounced(chartUI.chart, fixedAfter, fixedBefore)
      dygraph.updateOptions({
        dateWindow: [fixedAfter * 1000, fixedBefore * 1000],
      })
    }

    const offsetToPercentage = (g, offsetX) => {
      const [axisAfterOffset] = g.toDomCoords(g.xAxisRange()[0], null)
      const x = offsetX - axisAfterOffset
      const w = g.toDomCoords(g.xAxisRange()[1], null)[0] - axisAfterOffset

      // Percentage from the left.
      return w === 0 ? 0 : x / w
    }

    const normalDef =
      typeof event.wheelDelta === "number" && !Number.isNaN(event.wheelDelta)
        ? event.wheelDelta / 40
        : event.deltaY * -1.2

    const normal = event.detail ? event.detail * -1 : normalDef
    const percentage = normal / 50

    const offsetX = event.offsetX || event.layerX - event.target.offsetLeft
    const xPct = offsetToPercentage(dygraph, offsetX)

    zoom(dygraph, percentage, xPct)
  }

  let lastTouchEndTime = 0
  let dygraphLastTouchMove = 0
  let dygraphLastTouchPageX = 0

  const touchStart = (event, dygraph, context) => {
    Dygraph.defaultInteractionModel.touchstart(event, dygraph, context)

    context.touchDirections = { x: true, y: false }

    dygraphLastTouchMove = 0
    dygraphLastTouchPageX = event.touches[0].pageX || 0
  }

  const touchMove = (event, dygraph, context) => {
    Dygraph.defaultInteractionModel.touchmove(event, dygraph, context)

    if (!dygraphLastTouchMove) chartUI.sdk.trigger("panStart", chartUI.chart)

    dygraphLastTouchMove = Date.now()
  }

  const touchEnd = (event, dygraph, context) => {
    const now = Date.now()

    if (now - lastTouchEndTime < doubleTapDelay) {
      chartUI.trigger("dblclick", event, dygraph, context)
      lastTouchEndTime = now
      return
    }

    lastTouchEndTime = now

    Dygraph.defaultInteractionModel.touchend(event, dygraph, context)

    if (dygraphLastTouchMove === 0 && dygraphLastTouchPageX !== 0) {
      chartUI.chart.updateAttribute("clickX", [context.initialTouches?.[0]?.dataX, null])
      return
    }

    if (chartUI.chart.getAttribute("panning"))
      chartUI.sdk.trigger("panEnd", chartUI.chart, dygraph.dateWindow_)
  }

  const unregister = chartUI
    .on("mousedown", mousedown)
    .on("mouseup", mouseup)
    .on("wheel", onZoom)
    .on("dblclick", chartUI.chart.resetNavigation)
    .on("touchstart", touchStart)
    .on("touchmove", touchMove)
    .on("touchend", touchEnd)

  return () => {
    unregister()
    destroy()
  }
}
