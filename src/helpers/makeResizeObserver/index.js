export default (element, action, initialAction) => {
  let id
  let firstTime = true

  let resizeObserver = new ResizeObserver(() => {
    if (firstTime) {
      firstTime = false
      id = setTimeout(() => initialAction?.(), 200)
      return
    }
    clearTimeout(id)
    id = setTimeout(action, 200)
  })

  resizeObserver.observe(element)

  return () => {
    clearTimeout(id)
    if (resizeObserver) resizeObserver.disconnect()
    resizeObserver = null
  }
}
