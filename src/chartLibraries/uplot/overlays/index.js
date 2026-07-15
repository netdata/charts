import types from "./types"

export default chartUI => {
  const drawOverlay = id => {
    const overlays = chartUI.chart.getAttribute("overlays")
    const { type } = overlays[id]
    const makeOverlay = types[type]
    if (!makeOverlay) return
    makeOverlay(chartUI, id)
  }

  const draw = u => {
    const overlays = chartUI.chart.getAttribute("overlays")
    const ids = Object.keys(overlays || {})
    const draftAnnotation = chartUI.chart.getAttribute("draftAnnotation")

    if (!ids.length && !draftAnnotation) return

    const dpr = u.pxRatio || 1
    u.ctx.save()
    u.ctx.scale(dpr, dpr)

    ids.forEach(drawOverlay)

    if (draftAnnotation) {
      const makeOverlay = types["annotation"]
      if (makeOverlay) makeOverlay(chartUI, "draftAnnotation")
    }

    u.ctx.restore()
  }

  const render = () => {
    const u = chartUI.getUPlot()
    if (u) u.redraw()
  }

  const destroy = () => render()

  const toggle = () => render()

  return { toggle, destroy, draw }
}
