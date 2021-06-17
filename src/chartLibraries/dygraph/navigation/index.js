import highlight from "./highlight"
import pan from "./pan"

const navigations = { highlight, select: highlight, pan }

export default chartUI => {
  let unregister

  const destroy = () => unregister?.()

  const set = mode => {
    destroy()
    unregister = navigations[mode]?.(chartUI)
  }

  return { set, destroy }
}
