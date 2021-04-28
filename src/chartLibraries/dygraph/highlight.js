export default chartUI => {
  const drawHighlight = (canvas, area, g) => {
    const { highlight, after, before } = chartUI.chart.attributes
    const [hAfter, hBefore] = highlight

    if (hAfter > after && hBefore < before) {
      const x = g.toDomXCoord(hAfter)
      const width = g.toDomXCoord(hBefore) - x

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
