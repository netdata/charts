export default sdk => {
  const offStart = sdk.on("highlightStart", chart => {
    if (chart.getAttribute("navigation") !== "select") return

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      node.updateAttributes({ enabledHover: false, highlighting: true })
    })
  })

  const offEnd = sdk.on("highlightEnd", (chart, highlight) => {
    if (chart.getAttribute("navigation") !== "select") return

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      node.updateAttributes({
        enabledHover: true,
        highlighting: false,
      })
    })

    if (highlight === null) return

    const [after, before] = highlight
    chart.moveX(after, before)
  })

  return () => {
    offStart()
    offEnd()
  }
}
