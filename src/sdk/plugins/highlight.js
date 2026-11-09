const getOverlays = (node, range) => {
  const { overlays, after, before } = node.getAttributes()

  if (range) {
    return {
      ...overlays,
      highlight: {
        range,
        type: "highlight",
        moveX: { after, before },
      },
    }
  }

  const nextOverlays = { ...overlays }
  delete nextOverlays.highlight
  return nextOverlays
}

export default sdk => {
  const offStart = sdk.on("highlightStart", chart => {
    if (chart.getAttribute("navigation") !== "highlight") return

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      node.updateAttributes({ enabledHover: false, highlighting: true })
    })
  })

  const offEnd = sdk.on("highlightEnd", (chart, range) => {
    if (chart.getAttribute("navigation") !== "highlight") return

    const isLive = chart.getAttribute("after") < 0
    const now = Math.floor(Date.now() / 1000)

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      const overlays = getOverlays(node, range)
      const after = node.getAttribute("after")
      const freeze = isLive && after < 0

      node.updateAttributes({
        enabledHover: true,
        highlighting: false,
        overlays,
        ...(freeze && { after: now + after, before: now }),
      })
    })
  })

  return () => {
    offStart()
    offEnd()
  }
}
