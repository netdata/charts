import React from "react"
import { Flex, TextMicro } from "@netdata/netdata-ui"

const ChangeIndicator = ({ change, tab = "window" }) => {
  if (!change) return null

  const color =
    change.direction === "neutral"
      ? "stale"
      : change.direction === "up"
        ? "secondaryColorAI"
        : "warningText"
  const arrow = change.direction === "neutral" ? "=" : change.direction === "up" ? "↑" : "↓"

  return (
    <Flex alignItems="center" gap={0.5}>
      <TextMicro color={color} whiteSpace="nowrap">
        {change.formatted} {arrow}
      </TextMicro>
    </Flex>
  )
}

export default ChangeIndicator
