import React, { memo } from "react"
import { TextMicro } from "@netdata/netdata-ui"
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

const Units = ({ visible, dimensionId, ...rest }) => {
  const units = useUnitSign({ dimensionId })

  if (!visible) return null

  return <Value {...rest}>{units}</Value>
}

export default memo(Units)
