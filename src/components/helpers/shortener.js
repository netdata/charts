import React, { useMemo, forwardRef } from "react"
import shorten from "@/helpers/shorten"

const Shortener = forwardRef(({ text, maxLength = 15, Component = "div", ...rest }, ref) => {
  const truncated = useMemo(() => (text ? shorten(text, maxLength) : null), [text, maxLength])

  return (
    <Component ref={ref} {...rest}>
      {truncated}
    </Component>
  )
})

export default Shortener
