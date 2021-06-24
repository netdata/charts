import React, { useEffect, useLayoutEffect, useRef, useState } from "react"

export default chart => {
  const ref = useRef()

  useLayoutEffect(() => {
    const mouseout = e => {
      let node = e.relatedTarget
      while (node && node !== ref.current) {
        node = node.parentElement
      }

      if (node !== ref.current) chart.blur()
    }
    ref.current.addEventListener("mouseover", chart.focus)
    ref.current.addEventListener("mouseout", mouseout)

    return () => {
      ref.current.removeEventListener("mouseover", chart.focus)
      ref.current.removeEventListener("mouseout", chart.blur)
    }
  }, [])

  return ref
}
