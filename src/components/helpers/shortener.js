import React, { useMemo, forwardRef } from "react"

export const short = (text, maxLength) => {
  if (text.length <= maxLength) return text

  text = text.trim()

  const last3 = text.substring(text.length - 4)
  maxLength = maxLength - 1

  text = text.substring(text.length - 4, text.length - 1)

  text = text
    .split(/[\s-]/)
    .map(word => {
      const middle = word.substring(1, word.length - 2)
      return [word.charAt(0), middle.replace(/([aeiou])/gi, ""), word.charAt(word.length - 1)].join(
        ""
      )
    })
    .join("-")

  if (text.length <= maxLength) return text + last3

  text = text.replace(/(\w)\1+/g, "$1")

  if (text.length <= maxLength) return text + last3

  maxLength = maxLength - 3

  return `${text.substring(0, maxLength - 1)}...${last3}`
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
