import React, { memo } from "react"
import { TextSmall } from "@netdata/netdata-ui"
import { useAttributeValue, useIsModern } from "@/components/provider"
import Badge from "@/components/line/badge"

const isMissing = value => value === null || value === undefined || value === ""

const badgeByStatus = {
  critical: "error",
  clear: "success",
}

const AlarmRange = ({ id }) => {
  const overlays = useAttributeValue("overlays")
  const { status, valueTriggered } = overlays[id]
  const badgeType = badgeByStatus[status] || status
  const isModern = useIsModern()

  if (isModern && isMissing(valueTriggered)) return null

  return (
    <Badge type={badgeType} noBorder>
      <TextSmall color="inherit">
        Triggered value:{" "}
        <TextSmall strong color="inherit">
          {valueTriggered}
        </TextSmall>
      </TextSmall>
    </Badge>
  )
}

export default memo(AlarmRange)
