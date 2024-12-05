import React, { useState, useEffect, useRef } from "react"

const FontSizer = ({
  children,
  Component = "div",
  maxHeight = 100,
  maxWidth = 100,
  maxFontSize = 500,
  minFontSize = 10,
  ...rest
}) => {
  const [ref, setRef] = useState()
  const cancelRef = useRef(false)

  useEffect(() => {
    if (!ref) return

    const timeoutId = setTimeout(() => {
      cancelRef.current = false
      let fontSize = maxFontSize

      ref.style.animation = "font-size 02s"
      ref.style.fontSize = fontSize + "px"

      while (
        !cancelRef.current &&
        fontSize > minFontSize &&
        (ref.offsetWidth > maxWidth || ref.offsetHeight > maxHeight)
      ) {
        const delta = Math.ceil(fontSize / 100)
        fontSize = fontSize - delta
        ref.style.fontSize = fontSize + "px"
      }
    })

    return () => {
      cancelRef.current = true
      clearTimeout(timeoutId)
    }
  }, [children, maxHeight, maxWidth, ref])

  return (
    <Component truncate ref={setRef} {...rest}>
      {children}
    </Component>
  )
}

export default FontSizer
