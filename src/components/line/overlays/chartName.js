import React from "react"
import { TextNano } from "@netdata/netdata-ui/lib/components/typography"
import { useAttributeValue } from "@/components/provider"

const ChartName = ({ field }) => {
  const value = useAttributeValue(field)

  if (!value) return null

  return <TextNano>{value}</TextNano>
}

export default ChartName
