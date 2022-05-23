import React, { memo } from "react"
import { useAttributeValue } from "@/components/provider"
import Badge, { getColors } from "@/components/line/badge"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"

const badgeByStatus = {
  critical: "error",
  clear: "success",
}

const Alarm = ({ id }) => {
  const overlays = useAttributeValue("overlays")
  const { status, value } = overlays[id]
  const badgeType = badgeByStatus[status] || status
  const { color } = getColors(badgeType)

  return (
    <Badge type={badgeType} noBorder>
      <TextSmall color={color}>
        First time value:{" "}
        <TextSmall strong color={color}>
          {value}
        </TextSmall>
      </TextSmall>
    </Badge>
  )
}

export default memo(Alarm)
