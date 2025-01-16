import React, { useState, useEffect, useRef } from "react"

const FontSizer = ({
  children,
  Component = "div",
  maxHeight = 100,
  maxWidth = 100,
  maxFontSize = 500,
  minFontSize = 10,
  cacheKey,
  ...rest
}) => {
  const [ref, setRef] = useState()

  useEffect(() => {
    if (!ref) return

    requestAnimationFrame(() => {
      let fontSize = maxFontSize

      ref.style.animation = "font-size 02s"
      ref.style.fontSize = fontSize + "px"

      const widthScale = maxWidth / ref.offsetWidth
      const heightScale = maxHeight / ref.offsetHeight

      const scaleFactor = Math.min(widthScale, heightScale)
      fontSize = Math.floor(maxFontSize * scaleFactor) || 1

      ref.style.fontSize = fontSize + "px"
    })
  }, [children, maxHeight, maxWidth, ref, cacheKey])

  return (
    <Component truncate ref={setRef} {...rest}>
      {children}
    </Component>
  )
}

export default FontSizer
