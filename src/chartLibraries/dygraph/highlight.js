export default chartUI => {
  const drawHighlight = (canvas, area, g) => {
    const { highlight, after, before } = chartUI.chart.getAttributes()
    const [hAfter, hBefore] = highlight

    const now = Date.now() / 1000
    const afterTimestamp = after > 0 ? after : now + after
    const beforeTimestamp = after > 0 ? before : now

    if (hAfter > afterTimestamp && hBefore < beforeTimestamp) {
      const x = g.toDomXCoord(hAfter * 1000)
      const width = g.toDomXCoord(hBefore * 1000) - x

      canvas.fillStyle = "rgba(128,128,128,0.5)"
      canvas.fillRect(x, 0, width, area.h)
    }
  }

  const destroy = () => chartUI.off("underlayCallback", drawHighlight)

  const toggle = range => {
    destroy()

    if (range) chartUI.on("underlayCallback", drawHighlight)

    chartUI.getDygraph().renderGraph_(false)
  }

  return { toggle, destroy }
}
