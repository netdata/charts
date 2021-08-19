import React, { useEffect, useState } from "react"
import ChartContainer from "@/components/chartContainer"
import withChart from "@/components/withChart"
import { useChart, useMetadata, useUnitSign, useAttributeValue } from "@/components/provider"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"

const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
`

const Value = () => {
  const chart = useChart()

  const getValue = () => {
    const v = chart.getUI().getValue()
    return chart.getConvertedValue(v)
  }
  const [value, setValue] = useState(getValue)

  useEffect(() => chart.getUI().on("rendered", () => setValue(getValue())), [])

  return (
    <Label color="main" fontSize="2em">
      {value}
    </Label>
  )
}

const Title = () => {
  const { title } = useMetadata()
  return (
    <Label color="border" fontSize="1.2em" strong>
      {title}
    </Label>
  )
}

const Unit = () => {
  const unit = useUnitSign()
  return (
    <Label color="border" fontSize="1em">
      {unit}
    </Label>
  )
}

const Container = styled(ChartContainer)`
  position: relative;
`

const StatsContainer = styled(Flex).attrs({
  alignContent: "center",
  position: "absolute",
  column: true,
  justifyContent: "between",
})`
  inset: ${({ inset }) => inset};
  text-align: center;
  font-size: ${({ fontSize }) => fontSize};
`

const Stats = () => {
  const chart = useChart()
  const width = chart.getUI().getChartWidth()

  return (
    <StatsContainer inset={`${width * 0.3}px 0`} fontSize={`${width / 15}px`}>
      <Title />
      <Value />
      <Unit />
    </StatsContainer>
  )
}

export const EasyPie = props => {
  const loaded = useAttributeValue("loaded")
  return <Container {...props}>{loaded && <Stats />}</Container>
}

export default withChart(EasyPie)
