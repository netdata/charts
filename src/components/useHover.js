import { useLayoutEffect, useRef, useState } from "react"

const useHover = ({ onHover, onBlur }) => {
  const ref = useRef()

  useLayoutEffect(() => {
    const mouseout = e => {
      let node = e.relatedTarget
      while (node && node !== ref.current) {
        node = node.parentElement
      }

      if (node !== ref.current) onBlur()
    }
    ref.current.addEventListener("mouseover", onHover)
    ref.current.addEventListener("mouseout", mouseout)

    return () => {
      ref.current.removeEventListener("mouseover", onHover)
      ref.current.removeEventListener("mouseout", onBlur)
    }
  }, [])

  return ref
}

export const useHovered = () => {
  const [focused, setFocused] = useState(false)
  const ref = useHover({ onHover: () => setFocused(true), onBlur: () => setFocused(false) })

  return [ref, focused]
}

export default useHover
