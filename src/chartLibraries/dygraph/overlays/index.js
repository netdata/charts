import types from "./types"

export default chartUI => {
  let off = null

  const drawOverlay = id => {
    const overlays = chartUI.chart.getAttribute("overlays")
    const { type } = overlays[id]
    types[type](chartUI, id)
  }

  const drawOverlays = () => {
    const overlays = chartUI.chart.getAttribute("overlays")
    Object.keys(overlays).forEach(drawOverlay)
  }

  const destroy = () => {
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
