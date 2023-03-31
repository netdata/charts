export default sdk => {
  return sdk
    .on("highlightHover", (chart, dimensionX, dimensionY) => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("hoverX", [dimensionX, dimensionY])
      })
    })
    .on("highlightBlur", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("hoverX", null)
      })
    })
    .on("hoverChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        if (node.getAttribute("hovering")) return
        node.updateAttributes({
          hovering: true,
          renderedAt:
            chart.getAttribute("after") < 0
              ? chart.getUI().getRenderedAt()
              : chart.getAttribute("before"),
        })
      })
    })
    .on("blurChart", chart => {
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttributes({ hovering: false, renderedAt: null })
      })
    })
}
