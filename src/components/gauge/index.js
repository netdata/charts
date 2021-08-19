import React, { useState, useEffect } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import ChartContainer from "@/components/chartContainer"
import withChart from "@/components/withChart"
import { useChart, useMetadata, useUnitSign, useAttributeValue } from "@/components/provider"

const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
`

const Title = () => {
  const { title } = useMetadata()

  return (
    <Label color="border" fontSize="1.2em" strong>
      {title}
    </Label>
  )
}

const Value = () => {
  const chart = useChart()

  const getValue = () => {
    const v = chart.getUI().getValue()
    return chart.getConvertedValue(v)
  }
  const [value, setValue] = useState(getValue)

  useEffect(() => chart.getUI().on("rendered", () => setValue(getValue())), [])

  return (
    <Label color="main" fontSize="2.2em" strong>
      {value}
    </Label>
  )
}

const Unit = () => {
  const unit = useUnitSign()
  return (
    <Label color="main" fontSize="1em" alignSelf="start">
      {unit}
    </Label>
  )
}

const Bound = ({ bound, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue(bound)

  return (
    <Label color="main" fontSize="1.7em" {...rest}>
      {chart.getConvertedValue(value)}
    </Label>
  )
}

const Bounds = () => {
  return (
    <Flex justifyContent="between">
      <Bound bound="min" />
      <Bound bound="max" />
    </Flex>
  )
}

const StatsContainer = styled(Flex).attrs({
  position: "absolute",
  column: true,
  justifyContent: "between",
  alignContent: "center",
})`
  inset: "0 10%";
  text-align: center;
  font-size: ${({ fontSize }) => fontSize};
`

const Stats = () => {
  const chart = useChart()
  const width = chart.getUI().getChartWidth()

  return (
    <StatsContainer fontSize={`${width / 20}px`}>
      <Title />
      <Value />
      <Bounds />
      <Unit />
    </StatsContainer>
  )
}

const Gauge = props => {
  const loaded = useAttributeValue("loaded")

  return (
    <Flex position="relative" {...props}>
      <ChartContainer as="canvas" />
      {loaded && <Stats />}
    </Flex>
  )
}

export default withChart(Gauge)
