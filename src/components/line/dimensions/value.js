import React from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useLatestValue } from "@/components/provider"

export const Value = props => (
  <TextMicro color="textDescription" data-testid="chartDimensions-value" {...props} />
)

const Container = ({ id, visible, resultKey, ...rest }) => {
  const value = useLatestValue(id, resultKey)

  if (!visible) return null

  return <Value {...rest}>{value}</Value>
}

export default Container
