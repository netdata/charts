const getMove = node => {
  const ancestor = node.getAncestor({ syncHighlight: true }) || node
  const after = ancestor.getAttribute("after")
  if (after > 0) return null

  const now = Math.floor(Date.now() / 1000)
  return { after: now + after, before: now }
}

const getOverlays = (node, range) => {
  const { overlays, after, before } = node.getAttributes()
  if (range) {
    return {
      ...overlays,
      highlight: {
        range,
        type: "highlight",
        moveX: { after: after, before: before },
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

    const move = getMove(chart)

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      const overlays = getOverlays(node, range)

      node.updateAttributes({
        enabledHover: true,
        highlighting: false,
        overlays,
        ...move,
      })
    })
  })

  return () => {
    offStart()
    offEnd()
  }
}
