import { trigger } from "./helpers"

const fillColorMap = {
  WARNING: "#FFC300",
  CRITICAL: "#FF4136",
  CLEAR: "#00AB44",
}

const OVERLAY_ALPHA = 0.3

const getArea = (dygraph, startMs, endMs) => {
  const [viewStart, viewEnd] = dygraph.xAxisRange()

  if (endMs < viewStart || startMs > viewEnd) return null

  const fromX = Math.max(viewStart, startMs)
  const toX = Math.min(viewEnd, endMs)

  const from = dygraph.toDomXCoord(fromX)
  const to = dygraph.toDomXCoord(toX)
  const width = to - from

  return { from, to, width }
}

const parseTimestamp = timestamp => {
  if (typeof timestamp === "number") return timestamp * 1000
  return new Date(timestamp).getTime()
}

export default (chartUI, id) => {
  const overlays = chartUI.chart.getAttribute("overlays")
  const { transitions = [], showCleared = true } = overlays[id]

  if (!transitions.length) return trigger(chartUI, id)

  const dygraph = chartUI.getDygraph()
  const { h } = dygraph.getArea()
  const { hidden_ctx_: ctx } = dygraph
  const [, viewEnd] = dygraph.xAxisRange()

  const sortedTransitions = [...transitions].sort(
    (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
  )

  ctx.save()
  ctx.globalAlpha = OVERLAY_ALPHA

  sortedTransitions.forEach((transition, index) => {
    const startMs = parseTimestamp(transition.timestamp)
    const nextTransition = sortedTransitions[index + 1]
    const endMs = nextTransition ? parseTimestamp(nextTransition.timestamp) : viewEnd

    const toState = transition.to.toUpperCase()
    const toColor = fillColorMap[toState]

    if (!toColor) return
    if (!showCleared && toState === "CLEAR") return

    const area = getArea(dygraph, startMs, endMs)

    if (!area) return

    const { from, width } = area

    ctx.beginPath()
    ctx.rect(from, 0, width, h)
    ctx.fillStyle = toColor
    ctx.fill()
    ctx.closePath()
  })

  ctx.restore()

  trigger(chartUI, id)
}
