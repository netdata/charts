import React from "react"
import { TextMicro } from "@netdata/netdata-ui"
import { useConvertedValue } from "@/components/provider"

export const Value = props => (
  <TextMicro color="textDescription" data-testid="chartDimensions-value" {...props} />
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
  const value = useConvertedValue(id, period, valueKey, objKey)

  if (!visible) return null

  return <Component {...rest}>{value}</Component>
}

export default ValueComponent
