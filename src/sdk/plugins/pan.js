export default sdk => {
  const offStart = sdk.on("panStart", chart => {
    chart
      .getApplicableNodes({ syncPanning: true })
      .forEach(node => node.updateAttributes({ enabledHover: false, panning: true }))
  })

  const offEnd = sdk.on("panEnd", (chart, [after, before]) => {
    chart.moveX(after / 1000, before / 1000)
    chart
      .getApplicableNodes({ syncPanning: true })
      .forEach(node => node.updateAttributes({ enabledHover: true, panning: false }))
  })

  return () => {
    offStart()
    offEnd()
  }
}
