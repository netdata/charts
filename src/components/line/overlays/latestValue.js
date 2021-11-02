import React from "react"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import { useLatestValue, useUnitSign } from "@/components/provider"

const LatestValue = ({ dimensionId, ...rest }) => {
  const unit = useUnitSign()
  const value = useLatestValue(dimensionId)

  return (
    <Text strong whiteSpace="nowrap" {...rest}>
      {!value || isNaN(value) ? "No data" : `${value} ${unit}`}
    </Text>
  )
}

export default LatestValue
