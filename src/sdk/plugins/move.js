export default sdk => {
  return sdk.on("moveX", (chart, after, before) => {
    chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
      node.updateAttributes({ after: Math.round(after), before: Math.round(before) })
      if (node.type === "chart") node.fetch().then(() => node.getUI().render())
    })
  })
}
