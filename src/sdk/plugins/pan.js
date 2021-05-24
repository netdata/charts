export default sdk => {
  const offStart = sdk.on("panStart", chart => {
    chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
      node.updateAttributes({ enabledHover: false, panning: true })
    })
  })

  const offEnd = sdk.on("panEnd", (chart, [after, before]) => {
    chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
      node.updateAttributes({ enabledHover: true, panning: false })
      node.moveX(after, before)
    })
  })

  return () => {
    offStart()
    offEnd()
  }
}
