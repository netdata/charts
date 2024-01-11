import React, { useState, useLayoutEffect } from "react"

const FontSizer = ({ children, Component = "div", maxHeight = 100, maxWidth = 100, ...rest }) => {
  const [ref, setRef] = useState()

  useLayoutEffect(() => {
    if (!ref) return

    let fontSize = 500

    ref.style.fontSize = fontSize + "px"

    while (fontSize > 10 && (ref.offsetWidth > maxWidth || ref.offsetHeight > maxHeight)) {
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
