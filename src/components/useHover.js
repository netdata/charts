import { useLayoutEffect, useRef, useState } from "react"

const defaultIsOut = () => true

const useHover = ({ onHover, onBlur, isOut = defaultIsOut }, deps) => {
  const ref = useRef()

  useLayoutEffect(() => {
    const mouseout = e => {
      let node = e.relatedTarget

      while (node && node !== ref.current && isOut(node)) {
        node = node.parentElement
      }

      if (node !== ref.current && isOut(node)) onBlur()
    }
    ref.current.addEventListener("mouseover", onHover)
    ref.current.addEventListener("mouseout", mouseout)

    return () => {
      ref.current.removeEventListener("mouseover", onHover)
      ref.current.removeEventListener("mouseout", mouseout)
    }
  }, deps)

  return ref
}

export const useHovered = ({ isOut } = {}) => {
  const [focused, setFocused] = useState(false)
  const ref = useHover(
    { onHover: () => setFocused(true), onBlur: () => setFocused(false), isOut },
    []
  )

  return [ref, focused]
}

export default useHover
