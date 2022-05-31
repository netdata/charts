export default sdk => {
  return sdk
    .on("highlightHover", (chart, dimensionX, dimensionY) => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("hoverX", [dimensionX, dimensionY])
      })
    })
    .on("hoverChart", chart => {
      syncChartsOnHover(chart)
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("hovering", true)
        syncChartsOnHover(node)
      })
    })
    .on("blurChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttributes({ hoverX: null, hovering: false })
      })
    })
}

const syncChartsOnHover = (node = {}) => {
  if (node.type === "chart" && node.getAttribute("active")) {
    node.fetchAndRender()
  }
}
