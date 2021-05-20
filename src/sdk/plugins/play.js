export default sdk => {
  let timeoutId

  const getNext = () => {
    timeoutId = setTimeout(() => {
      sdk.getNodes().forEach(node => {
        // or is loading
        if (node.type !== "chart") return
        // console.log("test")
        node.fetch()
        getNext()
      })
    }, 1000)
  }

  // getNext()

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
