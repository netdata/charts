import { debounce } from "throttle-debounce"
import limitRange from "@/helpers/limitRange"

export default chartUI => {
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
      if (fixedAfter === afterAxis && fixedBefore === beforeAxis) {
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

  const unregister = chartUI
    .on("mousedown", mousedown)
    .on("mouseup", mouseup)
    .on("wheel", onZoom)
    .on("dblclick", chartUI.chart.resetNavigation)

  return () => unregister()
}
