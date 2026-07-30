import React, { useState, useEffect, useRef } from "react"

export const findFittedFontSize = ({ minFontSize, maxFontSize, fits }) => {
  if (maxFontSize <= minFontSize || fits(maxFontSize)) return maxFontSize

  let lower = minFontSize + 1
  let upper = maxFontSize - 1
  let fitted = minFontSize

  while (lower <= upper) {
    const fontSize = Math.floor((lower + upper) / 2)

    if (fits(fontSize)) {
      fitted = fontSize
      lower = fontSize + 1
    } else {
      upper = fontSize - 1
    }
  }

  return fitted
}

const FontSizer = ({
  children,
  Component = "div",
  maxHeight = 100,
  maxWidth = 100,
  maxFontSize = 50,
  minFontSize = 10,
  ...rest
}) => {
  const [ref, setRef] = useState()
  const cancelRef = useRef(false)

  useEffect(() => {
    if (!ref) return

    const timeoutId = setTimeout(() => {
      cancelRef.current = false

      ref.style.animation = "font-size 02s"
      const fontSize = findFittedFontSize({
        minFontSize,
        maxFontSize,
        fits: nextFontSize => {
          if (cancelRef.current) return true

          ref.style.fontSize = nextFontSize + "px"
          return ref.offsetWidth <= maxWidth && ref.offsetHeight <= maxHeight
        },
      })

      const fittedFontSize = fontSize + "px"
      if (!cancelRef.current && ref.style.fontSize !== fittedFontSize)
        ref.style.fontSize = fittedFontSize
    })

    return () => {
      cancelRef.current = true
      clearTimeout(timeoutId)
    }
  }, [children, maxFontSize, maxHeight, maxWidth, minFontSize, ref])

  return (
    <Component truncate ref={setRef} {...rest}>
      {children}
    </Component>
  )
}

export default FontSizer
