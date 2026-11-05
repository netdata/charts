export const simulateTranslate = container => {
  const document = container.ownerDocument
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)

  textNodes.forEach(node => {
    const outer = document.createElement("font")
    const inner = document.createElement("font")
    inner.textContent = node.nodeValue
    outer.appendChild(inner)
    node.parentNode.replaceChild(outer, node)
  })
}

export const collectRenderErrors = callback => {
  const errors = []
  const onError = event => {
    errors.push(event.error)
    event.preventDefault()
  }

  window.addEventListener("error", onError)
  try {
    callback()
  } catch (error) {
    errors.push(error)
  } finally {
    window.removeEventListener("error", onError)
  }

  return errors
}
