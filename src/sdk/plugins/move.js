const getMove = (after, before) => {
  if (after < 0) return { after }

  if (before > Date.now() / 1000) return { after: Math.round(after - before) }

  return { after: Math.round(after), before: Math.round(before) }
}

export default sdk => {
  return sdk.on("moveX", (chart, after, before) => {
    const move = getMove(after, before)

    chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
      node.updateAttributes(move)
      if (node.type === "chart" && node.getAttribute("active"))
        node.fetch().then(() => node.getUI().render())
    })
  })
}
