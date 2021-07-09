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

export default chartUI => {
  let off = null

  const drawHighlight = () => {
    const highlight = chartUI.chart.getAttribute("highlight")
    if (!highlight) return

    const dygraph = chartUI.getDygraph()

    const { h } = dygraph.getArea()
    const { hidden_ctx_: ctx } = dygraph

    const area = getArea(dygraph, highlight)

    if (!area) {
      chartUI.trigger("highlightedAreaChanged")
      return
    }

    const { from, width } = area

    chartUI.trigger("highlightedAreaChanged", area)

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

  const destroy = () => {
    chartUI.trigger("highlightedAreaChanged")
    chartUI.getDygraph().renderGraph_(false)
    if (!off) return
    off()
    off = null
  }

  const toggle = () => {
    const highlight = chartUI.chart.getAttribute("highlight")
    if (!highlight) return destroy()

    if (!off) {
      off = chartUI.on("drawCallback", drawHighlight)
    }

    chartUI.getDygraph().renderGraph_(false)
  }

  return { toggle, destroy }
}
