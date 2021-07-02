import React from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"

export const Name = props => (
  <TextMicro
    color="textDescription"
    whiteSpace="nowrap"
    truncate
    data-testid="chartDimensions-name"
    {...props}
  />
)

const Container = ({ chart, id, ...rest }) => {
  const name = chart.getDimensionName(id)

  return <Name {...rest}>{name}</Name>
}

export default Container
