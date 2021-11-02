import React from "react"
import { TextNano } from "@netdata/netdata-ui/lib/components/typography"
import { useAttributeValue } from "@/components/provider"
import EllipsisInTheMiddle from "@/components/helpers/ellipsisInTheMiddle"

const ChartName = ({ field }) => {
  const value = useAttributeValue(field)

  if (!value) return null

  return <EllipsisInTheMiddle text={value} Component={TextNano} />
}

export default ChartName
