import React from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useLatestConvertedValue } from "@/components/provider"

export const Value = props => (
  <TextMicro color="textDescription" data-testid="chartDimensions-value" {...props} />
)

const ValueComponent = ({ id, visible, valueKey, Component = Value, ...rest }) => {
  const value = useLatestConvertedValue(id, valueKey)

  if (!visible) return null

  return <Component {...rest}>{value}</Component>
}

export default ValueComponent
