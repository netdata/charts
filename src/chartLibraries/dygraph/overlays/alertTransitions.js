import { trigger } from "./helpers"

const fillColorMap = {
  WARNING: "#FFC300",
  CRITICAL: "#FF4136",
  CLEAR: "#00AB44",
}

const OVERLAY_ALPHA = 0.3
const GRADIENT_WIDTH = 20

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
  const { alertTransitions = [] } = overlays[id]

  if (!alertTransitions.length) return trigger(chartUI, id)

  const dygraph = chartUI.getDygraph()
  const { h } = dygraph.getArea()
  const { hidden_ctx_: ctx } = dygraph
  const [, viewEnd] = dygraph.xAxisRange()

  const sortedTransitions = [...alertTransitions].sort(
    (a, b) => parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp)
  )

  ctx.save()
  ctx.globalAlpha = OVERLAY_ALPHA

  sortedTransitions.forEach((transition, index) => {
    const prevTransition = sortedTransitions[index - 1]
    const nextTransition = sortedTransitions[index + 1]

    const startMs = parseTimestamp(transition.timestamp)
    const endMs = nextTransition ? parseTimestamp(nextTransition.timestamp) : viewEnd

    const toState = transition.to.toUpperCase()
    const toColor = fillColorMap[toState]

    if (!toColor) return

    const area = getArea(dygraph, startMs, endMs)

    if (!area) return

    const { from, width } = area

    if (prevTransition) {
      const prevState = prevTransition.to.toUpperCase()
      const prevColor = fillColorMap[prevState]
      const gradientWidth = Math.min(GRADIENT_WIDTH, width)

      if (prevColor && gradientWidth > 0) {
        const gradient = ctx.createLinearGradient(from, 0, from + gradientWidth, 0)
        gradient.addColorStop(0, prevColor)
        gradient.addColorStop(1, toColor)

        ctx.beginPath()
        ctx.rect(from, 0, gradientWidth, h)
        ctx.fillStyle = gradient
        ctx.fill()
        ctx.closePath()

        if (width > gradientWidth) {
          ctx.beginPath()
          ctx.rect(from + gradientWidth, 0, width - gradientWidth, h)
          ctx.fillStyle = toColor
          ctx.fill()
          ctx.closePath()
        }
        return
      }
    }

    ctx.beginPath()
    ctx.rect(from, 0, width, h)
    ctx.fillStyle = toColor
    ctx.fill()
    ctx.closePath()
  })

  ctx.restore()

  trigger(chartUI, id)
}
