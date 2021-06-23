export default sdk => {
  sdk.getNodes().forEach(node => {
    node.updateAttribute("enabledHover", true)
  })

  const offHover = sdk.on("hoverX", (chart, x, y, dimensionX, dimensionY) => {
    chart.getApplicableNodes({ syncHover: true }).forEach(node => {
      node.updateAttribute("hoverX", [dimensionX, dimensionY])
    })
  })

  const offBlur = sdk.on("blur", chart => {
    chart.getApplicableNodes({ syncHover: true }).forEach(node => {
      node.updateAttribute("hoverX", null)
    })
  })

  return () => {
    offHover()
    offBlur()

    sdk.getNodes().forEach(node => {
      node.updateAttribute("enabledHover", false)
    })
  }
}
