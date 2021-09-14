import generic from "./generic"
import select from "./select"
import pan from "./pan"
import selectVertical from "./selectVertical"

const navigations = { highlight: select, select, selectVertical, pan }

export default chartUI => {
  let unregister
  let unregisterGeneric

  const destroy = () => {
    unregister?.()
    unregisterGeneric?.()
  }

  const set = mode => {
    destroy()
    unregister = navigations[mode]?.(chartUI)
    unregisterGeneric = generic(chartUI)
  }

  return { set, destroy }
}
