import React from "react"
import { TextNano } from "@netdata/netdata-ui/lib/components/typography"
import { useAttributeValue, useMetadata } from "@/components/provider"
import EllipsisInTheMiddle from "@/components/helpers/ellipsisInTheMiddle"

const ChartName = ({ field, normalize, ...rest }) => {
  let value = useAttributeValue(field)
  const metadata = useMetadata()

  if (!value) {
    value = metadata[field]
  }

  if (!value) return null

  if (normalize) {
    value = normalize(value)
  }

  return <EllipsisInTheMiddle text={value} Component={TextNano} {...rest} />
}

export default ChartName
