export default sdk => {
  sdk.getNodes().forEach(node => {
    node.updateAttribute("enabledHover", true)
  })

  const offHoverX = sdk.on("hoverX", (chart, x, y, dimensionX, dimensionY) => {
    chart.getApplicableNodes({ syncHover: true }).forEach(node => {
      node.updateAttribute("hoverX", [dimensionX, dimensionY])
    })
  })

  const offBlurChart = sdk.on("blurChart", chart => {
    chart.getApplicableNodes({ syncHover: true }).forEach(node => {
      node.updateAttribute("hoverX", null)
    })
  })

  return () => {
    offHoverX()
    offBlurChart()

    sdk.getNodes().forEach(node => {
      node.updateAttribute("enabledHover", false)
    })
  }
}
