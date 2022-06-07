import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

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

const Badge = ({ type, children, noBorder, ...rest }) => {
  const { background, color } = getColors(type)

  return (
    <Flex
      padding={[0.2, 1]}
      background={background}
      round={3}
      border={noBorder ? undefined : { color, size: "1px", side: "all" }}
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
