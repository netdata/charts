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
  const suffix = change.direction === "neutral" ? "to selected" : "than selected"

  return (
    <Flex alignItems="center" justifyContent="start" gap={0.5} width="110px">
      <Flex width="60px" justifyContent="end">
        <TextMicro color={color}>
          {change.formatted} {arrow}
        </TextMicro>
      </Flex>
      <Flex width="60px">
        <TextMicro color="textLite" fontSize="9px">
          {suffix}
        </TextMicro>
      </Flex>
    </Flex>
  )
}

export default ChangeIndicator
