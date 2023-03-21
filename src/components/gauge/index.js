import React, { forwardRef, useState } from "react"
import styled, { keyframes } from "styled-components"
import { Box, Flex, Text } from "@netdata/netdata-ui"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useUnitSign,
  useAttributeValue,
  useImmediateListener,
  useOnResize,
} from "@/components/provider"
import { getSizeBy } from "@netdata/netdata-ui/lib/theme/utils"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import textAnimation from "../helpers/textAnimation"

const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
  flex: ${({ flex = 0 }) => flex};
  ${({ isFetching }) => isFetching && textAnimation};
`

const StrokeLabel = styled(Label)`
  text-shadow: 0.02em 0 ${getColor("borderSecondary")}, 0 0.02em ${getColor("borderSecondary")},
    -0.02em 0 ${getColor("borderSecondary")}, 0 -0.02em ${getColor("borderSecondary")};
`
export const Value = () => {
  const chart = useChart()

  const getValue = () => {
    const { hoverX, after } = chart.getAttributes()
    if (!hoverX && after > 0) return "-"

    const v = chart.getUI().getValue()
    return chart.getConvertedValue(v)
  }
  const [value, setValue] = useState(getValue)

  useImmediateListener(() => chart.getUI().on("rendered", () => setValue(getValue())), [])

  return (
    <StrokeLabel flex="2" color="main" fontSize="2.2em" strong>
      {value}
    </StrokeLabel>
  )
}

export const Unit = () => {
  const unit = useUnitSign()
  return (
    <Label color="border" fontSize="1em">
      {unit}
    </Label>
  )
}

const useEmptyValue = () => {
  const chart = useChart()

  const getValue = () => {
    const { hoverX, after } = chart.getAttributes()
    return !hoverX && after > 0
  }
  const [value, setValue] = useState(getValue)

  useImmediateListener(() => chart.getUI().on("rendered", () => setValue(getValue())), [])

  return value
}

export const Bound = ({ bound, empty, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue(bound)

  return (
    <Label color="main" fontSize="1.7em" {...rest}>
      {empty ? "-" : chart.getConvertedValue(value)}
    </Label>
  )
}

export const BoundsContainer = styled(Flex).attrs({ justifyContent: "between" })`
  padding-left: 6%;
`

export const Bounds = () => {
  const empty = useEmptyValue()

  return (
    <BoundsContainer>
      <Bound bound="min" empty={empty} />
      <Bound bound="max" empty={empty} />
    </BoundsContainer>
  )
}

export const StatsContainer = styled(Flex).attrs({
  position: "absolute",
  column: true,
  justifyContent: "between",
  alignContent: "center",
})`
  inset: ${({ inset }) => inset};
  text-align: center;
  font-size: ${({ fontSize }) => fontSize};
`

export const Stats = () => {
  const { width } = useOnResize()

  return (
    <StatsContainer fontSize={`${width / 30}px`} inset="70% 25% 20%">
      <Flex column>
        <Value />
        <Unit />
      </Flex>
      <Bounds />
    </StatsContainer>
  )
}

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 0.6; }
`

export const Skeleton = styled(Flex).attrs(props => ({
  background: "borderSecondary",
  round: "100%",
  width: "100%",
  height: "100%",
  ...props,
}))`
  animation: ${frames} 1.6s ease-in infinite;
`

export const Gauge = forwardRef((props, ref) => {
  const loaded = useAttributeValue("loaded")

  return (
    <ChartWrapper justifyContent="start" ref={ref}>
      <Box height="80%" width="100%" position="relative">
        {loaded ? (
          <ChartContainer as="canvas" width="100% !important" height="100% !important" />
        ) : (
          <Skeleton />
        )}
        <Stats />
      </Box>
    </ChartWrapper>
  )
})

export default withChart(Gauge, { tile: true })
