import types from "./types"

export default chartUI => {
  const render = () => {
    const dygraph = chartUI.getDygraph()
    if (dygraph) dygraph.renderGraph_(false)
  }

  const drawOverlay = id => {
    const overlays = chartUI.chart.getAttribute("overlays")
    const { type } = overlays[id]
    const makeOverlay = types[type]
    if (!makeOverlay) return
    makeOverlay(chartUI, id)
  }

  const drawOverlays = () => {
    const overlays = chartUI.chart.getAttribute("overlays")
    render()

    Object.keys(overlays).forEach(drawOverlay)
  }

  return { drawOverlays }
}
