const getArea = (dygraph, range) => {
  const [after, before] = dygraph.xAxisRange()
  const afterTimestamp = after
  const beforeTimestamp = before

  const [hAfter, hBefore] = range
  const hAfterTimestamp = hAfter * 1000
  const hBeforeTimestamp = hBefore * 1000

  const fromX = Math.max(afterTimestamp, hAfterTimestamp)
  const toX = Math.min(beforeTimestamp, hBeforeTimestamp)

  if (hBeforeTimestamp < afterTimestamp || hAfterTimestamp > beforeTimestamp) return null

  const from = dygraph.toDomXCoord(fromX)
  const to = dygraph.toDomXCoord(toX)
  const width = to - from

  return { from, to, width }
}

const borderColorMap = {
  warning: "#FFC300",
  critical: "#F59B9B",
  clear: "#68C47D",
}

export default chartUI => {
  let off = null

  const trigger = (id, area) =>
    requestAnimationFrame(() => chartUI.trigger(`overlayedAreaChanged:${id}`, area))

  const drawHighlight = id => {
    const overlays = chartUI.chart.getAttribute("overlays")
    const { range } = overlays[id]

    if (!range) return

    const dygraph = chartUI.getDygraph()

    const { h } = dygraph.getArea()
    const { hidden_ctx_: ctx } = dygraph

    const area = getArea(dygraph, range)

    if (!area) return trigger(id)

    const { from, width } = area

    trigger(id, area)

    ctx.save()
    ctx.beginPath()

    ctx.rect(from, 0, width, h - 1)

    ctx.fillStyle = "rgba(207, 213, 218, 0.12)"
    ctx.fill()
    ctx.setLineDash([2, 4])
    ctx.lineWidth = 1
    ctx.strokeStyle = "#CFD5DA"

    ctx.stroke()
    ctx.closePath()
    ctx.restore()
  }

  const drawAlarm = id => {
    const overlays = chartUI.chart.getAttribute("overlays")
    const { when, status } = overlays[id]

    const dygraph = chartUI.getDygraph()

    const { h } = dygraph.getArea()
    const { hidden_ctx_: ctx } = dygraph

    const area = getArea(dygraph, [when, when])

    if (!area) return trigger(id)

    const horizontalPadding = 3
    const from = area.from - horizontalPadding
    const width = 2 * horizontalPadding

    trigger(id, area)

    ctx.save()
    ctx.beginPath()

    ctx.rect(from, 0, width, h - 1)
    ctx.fillStyle = borderColorMap[status]
    ctx.globalAlpha = 0.4
    ctx.fill()
    ctx.setLineDash([2, 4])
    ctx.lineWidth = 1
    ctx.strokeStyle = "#CFD5DA"

    ctx.stroke()
    ctx.closePath()
    ctx.restore()
  }

  const byType = {
    alarm: drawAlarm,
    highlight: drawHighlight,
  }

  const drawOverlay = id => {
    const overlays = chartUI.chart.getAttribute("overlays")
    const { type } = overlays[id]
    byType[type](id)
  }

  const drawOverlays = () => {
    const overlays = chartUI.chart.getAttribute("overlays")
    Object.keys(overlays).forEach(drawOverlay)
  }

  const destroy = () => {
    //   chartUI.trigger("highlightedAreaChanged")
    chartUI.getDygraph().renderGraph_(false)
    if (!off) return
    off()
    off = null
  }

  const toggle = () => {
    const overlays = chartUI.chart.getAttribute("overlays")
    if (Object.keys(overlays).length === 0) return destroy()

    if (!off) {
      off = chartUI.on("drawCallback", drawOverlays)
    }

    chartUI.getDygraph().renderGraph_(false)
  }

  return { toggle, destroy }
}
