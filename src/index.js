import mount from "./mount"
import parseDOM from "./sdk/parseDOM"
import makeDefaultSDK from "./makeDefaultSDK"

document.addEventListener("DOMContentLoaded", () => {
  const sdk = makeDefaultSDK()

  const { elements, nodeByElement } = parseDOM(sdk)

  elements.forEach(element => {
    const node = nodeByElement.get(element)
    if (node.type !== "chart") return

    mount(node, element)
  })
})
