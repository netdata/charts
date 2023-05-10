import React, { useMemo } from "react"
import shorten from "@/helpers/shorten"
import Tooltip from "@/components/tooltip"

const Shortener = ({ text, maxLength = 15, Component = "div", noTooltip, ...rest }) => {
  const truncated = useMemo(() => (text ? shorten(text, maxLength) : null), [text, maxLength])

  if (!noTooltip && truncated !== text)
    return (
      <Tooltip content={text}>
        <Component {...rest}>{truncated}</Component>
      </Tooltip>
    )

  return <Component {...rest}>{truncated}</Component>
}

export default Shortener
