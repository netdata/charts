import mount from "./components/mount"
import parseDOM from "./sdk/parseDOM"
import makeDefaultSDK from "./makeDefaultSDK"

import payloads from "@/fixtures/dimension3points90"

document.addEventListener("DOMContentLoaded", () => {
  const sdk = makeDefaultSDK()

  const { elements, nodeByElement } = parseDOM(sdk)

  elements.forEach(element => {
    const node = nodeByElement.get(element)
    if (node.type !== "chart") return

    node.doneFetch(payloads[0])
    mount(node, element)
  })
})
