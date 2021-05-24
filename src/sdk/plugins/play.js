export default sdk => {
  let timeoutId

  const getNext = () => {
    sdk.getNodes().forEach(node => {
      // or is loading
      if (node.type !== "chart") return

      node.fetch()
    })

    timeoutId = setTimeout(() => {
      getNext()
    }, 1000)
  }

  getNext()

  sdk.on("hover", () => {
    console.log("hover")
    clearTimeout(timeoutId)
    timeoutId = null
  })
  sdk.on("blur", () => {
    console.log("blur")
    if (!timeoutId) getNext()
  })

  return () => {}
}
