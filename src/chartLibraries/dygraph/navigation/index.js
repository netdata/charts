import generic from "./generic"
import select from "./select"
import pan from "./pan"
import selectVertical from "./selectVertical"

const navigations = { highlight: select, select, selectVertical, pan }

export default chartUI => {
  let unregister
  let unregisterGeneric

  const toggle = (enable, mode) => {
    if (!enable) return destroy()

    unregisterGeneric = generic(chartUI)

    if (mode) set(mode)
  }

  const destroyNavigation = () => {
    unregister?.()
    unregister = null
  }

  const destroy = () => {
    destroyNavigation()
    unregisterGeneric?.()
    unregisterGeneric = null
  }

  const set = mode => {
    if (!unregisterGeneric) return

    destroyNavigation()
    unregister = navigations[mode]?.(chartUI)
  }

  return { toggle, set, destroy }
}
