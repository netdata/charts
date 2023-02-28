import React, { memo } from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useUnitSign } from "@/components/provider"

export const Value = props => (
  <TextMicro
    color="textDescription"
    whiteSpace="nowrap"
    truncate
    data-testid="chartDimensions-units"
    {...props}
  />
)

const Units = ({ visible }) => {
  const units = useUnitSign()

  if (!visible) return null
  return <Value>{units}</Value>
}

export default memo(Units)
