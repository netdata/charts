export default sdk => {
  let deactivated = []

  return sdk.on("fullscreen", (chart, isFullscreen) => {
    if (isFullscreen) {
      deactivated = sdk.getNodes(
        (node, { active }) =>
          node.type === "chart" && active && node.getId() !== chart.getId()
      )
      deactivated.forEach(node => node.deactivate())
      return
    }

    deactivated.forEach(node => node.activate())
    deactivated = []
  })
}
