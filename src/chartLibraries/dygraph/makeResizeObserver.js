export default (element, action) => {
  let id
  let firstTime = true

  let resizeObserver = new ResizeObserver(() => {
    if (firstTime) {
      firstTime = false
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
