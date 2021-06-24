const minutes15 = -1 * 15 * 60

export default sdk => {
  return sdk.on("moveX", (chart, after, before) => {
    const move =
      before > Date.now() / 1000
        ? { after: after - before }
        : { after: Math.round(after), before: Math.round(before) }

    chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
      node.updateAttributes(move)
      if (node.type === "chart" && node.getAttribute("active"))
        node.fetch().then(() => node.getUI().render())
    })
  })
}
