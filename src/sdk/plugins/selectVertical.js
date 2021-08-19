export default sdk => {
  const offStart = sdk.on("highlightVerticalStart", chart => {
    if (chart.getAttribute("navigation") !== "selectVertical") return

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      node.updateAttributes({ enabledHover: false, highlighting: true })
    })
  })

  const offEnd = sdk.on("highlightVerticalEnd", (chart, valueRange) => {
    if (chart.getAttribute("navigation") !== "selectVertical") return

    chart.getApplicableNodes({ syncHighlight: true }).forEach(node => {
      node.updateAttributes({
        enabledHover: true,
        highlighting: false,
      })
    })

    chart.updateAttributes({ valueRange })
    chart.once("blurChart", () => chart.updateAttributes({ valueRange: null }))
  })

  return () => {
    offStart()
    offEnd()
  }
}
