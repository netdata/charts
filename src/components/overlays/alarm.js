import React, { memo } from "react"
import { useAttributeValue } from "@/components/provider"
import Badge from "@/components/badge"

const badgeByStatus = {
  critical: "error",
  clear: "success",
}

const Alarm = ({ id }) => {
  const overlays = useAttributeValue("overlays")
  const { status, value } = overlays[id]
  const badgeType = badgeByStatus[status] || status

  return <Badge type={badgeType}>{value}</Badge>
}

export default memo(Alarm)
