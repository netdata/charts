import React from "react"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import { useChart } from "@/components/provider"

export const Name = props => (
  <TextMicro
    color="textDescription"
    whiteSpace="nowrap"
    truncate
    data-testid="chartDimensions-name"
    {...props}
  />
)

const Container = ({ id, ...rest }) => {
  const chart = useChart()
  const name = chart.getDimensionName(id)

  return <Name {...rest}>{name}</Name>
}

export default Container
