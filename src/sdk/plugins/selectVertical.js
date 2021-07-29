export default sdk => {
  const offStart = sdk.on("highlightVerticalStart", chart => {
    if (chart.getAttribute("navigation") !== "selectVertical") return

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      node.updateAttributes({ enabledHover: false, highlighting: true })
    })
  })

  const offEnd = sdk.on("highlightVerticalEnd", chart => {
    if (chart.getAttribute("navigation") !== "selectVertical") return

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      node.updateAttributes({
        enabledHover: true,
        highlighting: false,
      })
    })

    // chart.once("blurChart", chart => {
    // reset zoom
    // })
  })

  return () => {
    offStart()
    offEnd()
  }
}
