export default sdk => {
  let timeoutId

  const getNext = () => {
    sdk.getNodes().forEach(node => {
      // or is loading
      if (node.type !== "chart") return

      const { loading, loaded, updatedAt } = node.getAttributes()
      const { updateEvery } = node.getMetadata()

      node.getUI().render()

      // console.log(updatedAt, updateEvery)
      if (loading) return
      if (!loaded || updatedAt + updateEvery * 1000 < Date.now()) {
        return node.fetch()
      }
    })
    timeoutId = setTimeout(() => {
      getNext()
    }, 1000)
  }

  getNext()

  const start = () => {
    if (!timeoutId) getNext()
  }

  const stop = () => {
    clearTimeout(timeoutId)
    timeoutId = null
  }

  sdk.getRoot().onAttributeChange("after", after => {
    if (after < 0) return start()

    stop()
  })

  sdk.on("hoverChart", () => {
    stop()
  })

  sdk.on("blurChart", () => {
    const after = sdk.getRoot().getAttribute("after")
    if (after < 0) start()
  })

  return () => {}
}
