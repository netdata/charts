import generic from "./generic"
import select from "./select"
import pan from "./pan"
import selectVertical from "./selectVertical"

const navigations = { highlight: select, select, selectVertical, pan }

export default chartUI => {
  let unregister

  const destroy = () => {
    unregister?.()
  }

  const unregisterGeneric = generic(chartUI)

  const destroyAll = () => {
    destroy()
    unregisterGeneric()
  }

  const set = mode => {
    destroy()
    unregister = navigations[mode]?.(chartUI)
  }

  return { set, destroy, destroyAll }
}
