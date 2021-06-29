export default sdk => {
  let timeoutId

  const getNext = () => {
    sdk.getNodes({ loaded: true, active: true }).forEach(node => {
      if (node.type === "chart") node.getUI().render()
    })
    timeoutId = setTimeout(() => {
      getNext()
    }, 1000)
  }

  const toggleRender = enable => {
    if (enable && !timeoutId) return getNext()
    if (!enable) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  return sdk
    .on("active", chart => {
      const { after, hovering, active } = chart.getAttributes()
      const autofetch = active && after < 0 && !hovering

      if (active && !autofetch) chart.fetch().then(() => chart.getUI().render())

      toggleRender(autofetch)
      chart.updateAttribute("autofetch", autofetch)
    })
    .on("hoverChart", chart => {
      const autofetch = false
      if (autofetch === chart.getAttribute("autofetch")) return

      toggleRender(autofetch)
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("autofetch", autofetch)
      })
    })
    .on("blurChart", chart => {
      const autofetch = chart.getAttribute("after") < 0 && chart.getAttribute("active")

      if (autofetch === chart.getAttribute("autofetch")) return

      toggleRender(autofetch)
      chart.getApplicableNodes({ syncHover: true }).forEach(node => {
        node.updateAttribute("autofetch", autofetch)
      })
    })
    .on("moveX", (chart, after) => {
      const autofetch = after < 0 && !chart.getAttribute("hovering")

      if (autofetch === chart.getAttribute("autofetch")) return

      toggleRender(autofetch)
      chart.getApplicableNodes({ syncPanning: true }).forEach(node => {
        node.updateAttribute("autofetch", autofetch)
      })
    })
}
