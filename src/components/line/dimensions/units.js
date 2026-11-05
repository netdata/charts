import React, { memo } from "react"
import { TextMicro } from "@netdata/netdata-ui"
import { useUnitSign, useValueUnitAttributes } from "@/components/provider"

export const Value = props => (
  <TextMicro
    color="textDescription"
    whiteSpace="nowrap"
    truncate
    data-testid="chartDimensions-units"
    {...props}
  />
)

const Units = ({
  visible,
  dimensionId,
  value,
  valueKey,
  scaleByValue,
  unitAttributes,
  unitsKey = "units",
  ...rest
}) => {
  const valueUnitAttributes = useValueUnitAttributes(value, {
    valueKey,
    dimensionId,
    unitsKey,
    scaleByValue,
  })
  const units = useUnitSign({
    dimensionId,
    key: unitsKey,
    unitAttributes: unitAttributes || valueUnitAttributes,
  })

  if (!visible || !units) return null

  return <Value {...rest}>{units}</Value>
}

export default memo(Units)
