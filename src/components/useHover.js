import { useLayoutEffect, useRef, useState } from "react"

const defaultIsOut = () => true

const useHover = ({ onHover, onBlur, isOut = defaultIsOut }, deps) => {
  const ref = useRef()

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const mouseout = e => {
      let node = e.relatedTarget

      while (node && node !== element && isOut(node)) {
        node = node.parentElement
      }

      if (node !== element && isOut(node)) onBlur()
    }

    const reconcileHover = () => {
      if (typeof element.matches !== "function") return

      if (element.matches(":hover")) onHover()
      else onBlur()
    }

    const visibilityChange = () => {
      if (document.visibilityState !== "visible") return
      if (typeof document.hasFocus === "function" && !document.hasFocus()) return

      reconcileHover()
    }

    element.addEventListener("mouseover", onHover)
    element.addEventListener("mouseout", mouseout)
    window.addEventListener("focus", reconcileHover)
    document.addEventListener("visibilitychange", visibilityChange)

    return () => {
      element.removeEventListener("mouseover", onHover)
      element.removeEventListener("mouseout", mouseout)
      window.removeEventListener("focus", reconcileHover)
      document.removeEventListener("visibilitychange", visibilityChange)
    }
  }, [...deps, ref.current])

  return ref
}

export const useHovered = ({ isOut } = {}, deps = []) => {
  const [focused, setFocused] = useState(false)

  const ref = useHover(
    { onHover: () => setFocused(true), onBlur: () => setFocused(false), isOut },
    deps
  )

  return [ref, focused]
}

export default useHover
