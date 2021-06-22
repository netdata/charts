export default sdk => {
  return sdk
    .on("highlightHover", (chart, x, y, dimensionX, dimensionY) => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("hoverX", [dimensionX, dimensionY])
      })
    })
    .on("hoverChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("hovering", true)
      })
    })
    .on("blurChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttributes({ hoverX: null, hovering: false })
      })
    })
}
