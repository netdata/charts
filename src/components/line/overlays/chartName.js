import React from "react"
import { TextSmall } from "@netdata/netdata-ui/lib/components/typography"
import { useAttributeValue } from "@/components/provider"

const ChartName = ({ id }) => {
  const overlays = useAttributeValue("overlays")
  const { key } = overlays[id]
  const value = useAttributeValue(key)

  if (!value) return null

  return <TextSmall>{value}</TextSmall>
}

export default ChartName
