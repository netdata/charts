import React from "react"
import { Flex, TextMicro } from "@netdata/netdata-ui"

const ChangeIndicator = ({ change }) => {
  if (!change) return null

  const color = change.direction === "up" ? "success" : "error"
  const arrow = change.direction === "up" ? "↑" : "↓"

  return (
    <Flex alignItems="center" gap={1}>
      <TextMicro color={color}>
        {change.formatted} {arrow}
      </TextMicro>
    </Flex>
  )
}

export default ChangeIndicator
