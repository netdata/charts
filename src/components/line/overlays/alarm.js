import React, { memo } from "react"
import { TextSmall } from "@netdata/netdata-ui"
import { useAttributeValue, useIsModern } from "@/components/provider"
import Badge, { getColors } from "@/components/line/badge"

const isMissing = value => value === null || value === undefined || value === ""

const badgeByStatus = {
  critical: "error",
  clear: "success",
}

const Alarm = ({ id }) => {
  const overlays = useAttributeValue("overlays")
  const { status, value } = overlays[id]
  const badgeType = badgeByStatus[status] || status
  const { color } = getColors(badgeType)
  const isModern = useIsModern()

  if (isModern && isMissing(value)) return null

  return (
    <Badge type={badgeType} noBorder>
      <TextSmall color={color}>
        Triggered value:{" "}
        <TextSmall strong color={color}>
          {value}
        </TextSmall>
      </TextSmall>
    </Badge>
  )
}

export default memo(Alarm)
