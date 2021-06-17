export default sdk => {
  let timeoutId

  const getNext = () => {
    sdk.getNodes().forEach(node => {
      const { active, loaded } = node.getAttributes()
      if (node.type !== "chart" || !active || !loaded) return
      node.getUI().render()
    })
    timeoutId = setTimeout(() => {
      getNext()
    }, 1000)
  }

  const start = () => {
    if (!timeoutId) getNext()
    sdk.getNodes().forEach(node => {
      node.updateAttribute("autofetch", true)
    })
  }

  const stop = () => {
    clearTimeout(timeoutId)
    timeoutId = null
    sdk.getNodes().forEach(node => {
      node.updateAttribute("autofetch", false)
    })
  }

  sdk.getRoot().onAttributeChange("after", after => {
    if (after < 0) return start()

    stop()
  })

  const offs = sdk
    .on("hoverChart", () => {
      stop()
    })
    .on("blurChart", () => {
      const after = sdk.getRoot().getAttribute("after")
      if (after < 0) start()
    })
    .on("nodeAdded", node => {
      if (timeoutId && node.type === "chart") return node.startAutofetch()
    })

  start()

  return () => {
    stop()
    offs()
  }
}
