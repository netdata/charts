import React, { useState, useEffect } from "react"

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

  useEffect(() => {
    if (!ref) return

    let fontSize = maxFontSize

    ref.style.fontSize = fontSize + "px"

    while (fontSize > minFontSize && (ref.offsetWidth > maxWidth || ref.offsetHeight > maxHeight)) {
      const delta = Math.ceil(fontSize / 100)
      fontSize = fontSize - delta
      ref.style.fontSize = fontSize + "px"
    }
  }, [children, maxHeight, maxWidth, ref])

  return (
    <Component truncate ref={setRef} {...rest}>
      {children}
    </Component>
  )
}

export default FontSizer
