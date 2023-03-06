import types from "./types"

export default chartUI => {
  let off = null

  const drawOverlay = id => {
    const overlays = chartUI.chart.getAttribute("overlays")
    const { type } = overlays[id]
    const makeOverlay = types[type]
    if (!makeOverlay) return
    makeOverlay(chartUI, id)
  }

  const drawOverlays = (dygraph, isInitial) => {
    // if (!isInitial) return
    // TODO Is the above needed?

    const overlays = chartUI.chart.getAttribute("overlays")
    Object.keys(overlays).forEach(drawOverlay)
  }

  const render = () => {
    const dygraph = chartUI.getDygraph()
    if (dygraph) dygraph.renderGraph_(false)
  }

  const destroy = () => {
    if (!off) return
    render()
    off()
    off = null
  }

  const toggle = () => {
    const overlays = chartUI.chart.getAttribute("overlays")
    if (Object.keys(overlays).length === 0) return destroy()

    if (!off) {
      off = chartUI.on("drawCallback", drawOverlays)
    } else {
      render()
    }
  }

  return { toggle, destroy }
}
