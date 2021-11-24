import React, { useMemo, forwardRef } from "react"
import Tooltip from "@/components/tooltip"

export const ellipsisInTheMiddle = (text, maxLength) => {
  if (text.length <= maxLength) return text

  const spanLength = Math.floor((maxLength - 3) / 2)
  return `${text.substring(0, spanLength)}...${text.substring(text.length - spanLength)}`
}

const EllipsisInTheMiddle = forwardRef(
  ({ text, maxLength = 15, Component = "div", ...rest }, ref) => {
    const truncated = useMemo(() => (text ? ellipsisInTheMiddle(text, maxLength) : null), [
      text,
      maxLength,
    ])

    return truncated !== text ? (
      <Tooltip content={text}>
        <Component ref={ref} {...rest}>
          {truncated}
        </Component>
      </Tooltip>
    ) : (
      <Component ref={ref} {...rest}>
        {text}
      </Component>
    )
  }
)

export default EllipsisInTheMiddle
