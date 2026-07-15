import React from "react"
import { createRoot } from "react-dom/client"
import PerfOverlay from "@/components/perf"
import { setEnabled, sampleHeap, reset } from "./registry"

export default sdk => {
  let container = null
  let root = null
  let heapId = null

  const mount = () => {
    if (container) return

    reset()
    setEnabled(true)
    heapId = setInterval(sampleHeap, 1000)

    container = document.createElement("div")
    container.setAttribute("data-testid", "perfOverlay-root")
    document.body.appendChild(container)

    root = createRoot(container)
    root.render(<PerfOverlay />)
  }

  const unmount = () => {
    setEnabled(false)

    if (heapId) {
      clearInterval(heapId)
      heapId = null
    }
    if (root) {
      root.unmount()
      root = null
    }
    if (container) {
      container.remove()
      container = null
    }
  }

  const off = sdk.getRoot().onAttributeChange("perfMonitor", value => (value ? mount() : unmount()))

  if (sdk.getRoot().getAttribute("perfMonitor")) mount()

  return () => {
    off()
    unmount()
  }
}
