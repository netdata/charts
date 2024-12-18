import React from "react"
import { TextSmall } from "@netdata/netdata-ui"
import { useConvertedValue } from "@/components/provider"

export const Value = props => (
  <TextSmall color="text" data-testid="chartDimensions-value" {...props} />
)

const ValueComponent = ({
  id,
  visible,
  valueKey,
  period = "latest",
  objKey,
  Component = Value,
  ...rest
}) => {
  const value = useConvertedValue(id, period, { valueKey, objKey, allowNull: true })

  if (!visible) return null

  return <Component {...rest}>{value}</Component>
}

export default ValueComponent
