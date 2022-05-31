import React, { useMemo, forwardRef } from "react"

export const short = (text, maxLength) => {
  if (text.length <= maxLength) return text

  text = text
    .split(/[\s-]/)
    .map(word => {
      const middle = word.substring(1, word.length - 1)
      return [word.charAt(0), middle.replace(/([aeiou])/gi, ""), word.charAt(word.length - 1)].join(
        ""
      )
    })
    .join("-")

  if (text.length <= maxLength) return text

  text = text.replace(/(.)\1+/g, "$1")

  if (text.length <= maxLength) return text

  text = text.replace(/(\d)\1+/g, "$1")

  if (text.length <= maxLength) return text

  const spanLength = Math.floor((maxLength - 3) / 2)

  return `${text.substring(0, spanLength)}...${text.substring(text.length - spanLength)}`
}

const Shortener = forwardRef(({ text, maxLength = 15, Component = "div", ...rest }, ref) => {
  const truncated = useMemo(() => (text ? short(text, maxLength) : null), [text, maxLength])

  return (
    <Component ref={ref} {...rest}>
      {truncated}
    </Component>
  )
})

export default Shortener
