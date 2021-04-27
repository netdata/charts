export default sdk => {
  sdk.getNodes().forEach(node => {
    node.updateAttribute("enabledHover", true)
  })

  const offHover = sdk.on("hover", (chart, x, y, dimensionX, dimensionY) => {
    chart.getApplicableNodes({ syncHover: true }).forEach(node => {
      node.updateAttribute("hover", [dimensionX, dimensionY])
    })
  })

  return () => {
    offHover()

    sdk.getNodes().forEach(node => {
      node.updateAttribute("enabledHover", false)
    })
  }
}
