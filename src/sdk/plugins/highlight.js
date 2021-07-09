const getMove = chart => {
  const ancestor = chart.getAncestor({ syncHighlight: true })
  const after = ancestor.getAttribute("after")
  if (after > 0) return null

  const now = Date.now() / 1000
  return { after: now + after, before: now }
}

export default sdk => {
  const offStart = sdk.on("highlightStart", chart => {
    if (chart.getAttribute("navigation") !== "highlight") return

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      node.updateAttributes({ enabledHover: false, highlighting: true })
    })
  })

  const offEnd = sdk.on("highlightEnd", (chart, highlight) => {
    if (chart.getAttribute("navigation") !== "highlight") return

    const move = getMove(chart)

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      node.updateAttributes({
        enabledHover: true,
        highlighting: false,
        highlight,
        ...move,
      })
    })
  })

  return () => {
    offStart()
    offEnd()
  }
}
