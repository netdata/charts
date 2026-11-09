import React from "react"
import { useTheme } from "styled-components"
import { TextMicro, Flex, getReadableColor } from "@netdata/netdata-ui"

const types = {
  error: { background: "errorBackground", color: "errorText" },
  warning: {
    background: "warningBackground",
    color: "warningText",
  },
  success: { background: ["green", "frostee"], color: "success" },
  neutral: { background: "elementBackground", color: "textLite" },
}

export const getColors = type => types[type] ?? types.error

const Badge = ({ type, children, noBorder, title, ...rest }) => {
  const theme = useTheme()
  const { background, color: borderColor } = getColors(type)
  const color = type === "neutral" ? "text" : getReadableColor(background)({ theme })

  return (
    <Flex
      padding={[0.2, 1]}
      background={background}
      round={3}
      color={color}
      border={noBorder ? undefined : { color: borderColor, size: "1px", side: "all" }}
      alignItems="center"
      data-testid="badge"
      {...rest}
    >
      {typeof children === "object" ? (
        children
      ) : (
        <TextMicro color={color} whiteSpace="nowrap">
          {children}
        </TextMicro>
      )}
    </Flex>
  )
}

export default Badge
