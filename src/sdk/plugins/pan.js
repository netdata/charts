export default sdk => {
  const offStart = sdk.on("panStart", chart => {
    chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
      node.updateAttributes({ enabledHover: false, panning: true })
    })
  })

  const offEnd = sdk.on("panEnd", (chart, [after, before]) => {
    if (before > Date.now()) return chart.updateAttributes({ enabledHover: true, panning: false })

    chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
      node.updateAttributes({ enabledHover: true, panning: false })
      node.moveX(Math.round(after / 1000), Math.round(before / 1000))
      if (node.type === "chart") node.fetch()
    })
  })

  return () => {
    offStart()
    offEnd()
  }
}
