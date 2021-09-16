import React, { useState } from "react"
import ChartContainer from "@/components/chartContainer"
import withChart from "@/components/hocs/withChart"
import {
  useChart,
  useTitle,
  useUnitSign,
  useAttributeValue,
  useListener,
  useOnResize,
} from "@/components/provider"
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
    const { hoverX, after } = chart.getAttributes()
    if (!hoverX && after > 0) return "-"

    const v = chart.getUI().getValue()
    return chart.getConvertedValue(v)
  }
  const [value, setValue] = useState(getValue)

  useListener(() => chart.getUI().on("rendered", () => setValue(getValue())), [])

  return (
    <Label color="main" fontSize="2em">
      {value}
    </Label>
  )
}

const Title = () => {
  const title = useTitle()
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
  width: "100%",
})`
  inset: ${({ inset }) => inset};
  text-align: center;
  font-size: ${({ fontSize }) => fontSize};
`

const Stats = () => {
  const width = useOnResize()

  return (
    <StatsContainer inset={`${width * 0.3}px 0`} fontSize={`${width / 15}px`}>
      <Title />
      <Value />
      <Unit />
    </StatsContainer>
  )
}

const Skeleton = styled(Flex).attrs({
  height: "0",
  background: "borderSecondary",
  flex: true,
})`
  border-radius: 100%;
  padding-bottom: 100%;
`

export const EasyPie = ({ width = "100%", rest }) => {
  const loaded = useAttributeValue("loaded")

  if (!loaded) return <Skeleton width={width} {...rest} />

  return (
    <Container width={width} {...rest}>
      {loaded && <Stats />}
    </Container>
  )
}

export default withChart(EasyPie)
