import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

const types = {
  error: { background: ["red", "roseWhite"], color: "error" },
  warning: {
    background: ["yellow", "safronMango"],
    color: "warning",
  },
}

const Badge = ({ type, children, ...rest }) => {
  const { background, color } = types[type]

  return (
    <Flex
      padding={[0.5, 2]}
      background={background}
      round={3}
      border={{ color, size: "1px", side: "all" }}
      alignItems="center"
      data-testid="chartHeader-badge"
      {...rest}
    >
      <TextMicro color={color}>{children}</TextMicro>
    </Flex>
  )
}

export default Badge
