import React, { forwardRef, useState } from "react"
import styled, { keyframes } from "styled-components"
import { Flex, Text } from "@netdata/netdata-ui"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useUnitSign,
  useAttributeValue,
  useImmediateListener,
  useOnResize,
} from "@/components/provider"
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
    return chart.getConvertedValue(v, { fractionDigits: 2 })
  }
  const [value, setValue] = useState(getValue)

  useImmediateListener(() => chart.getUI().on("rendered", () => setValue(getValue())), [])

  return (
    <StrokeLabel flex="2" color="main" fontSize="2em" strong>
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

export const Bound = ({ bound, value, empty, ...rest }) => {
  const chart = useChart()
  const attrValue = useAttributeValue(bound)

  return (
    <Label color="border" fontSize="1.3em" {...rest}>
      {empty ? "-" : chart.getConvertedValue(value || attrValue)}
    </Label>
  )
}

export const BoundsContainer = styled(Flex).attrs({
  alignItems: "center",
  justifyContent: "between",
  flex: true,
})``

export const Bounds = () => {
  const empty = useEmptyValue()

  const chart = useChart()
  const minMax = chart.getUI().getMinMax()

  return (
    <BoundsContainer>
      <Bound bound="min" empty={empty} value={minMax[0]} />
      <Bound bound="max" empty={empty} value={minMax[1]} />
    </BoundsContainer>
  )
}

export const StatsContainer = styled(Flex).attrs({
  position: "absolute",
  column: true,
  alignContent: "center",
  justifyContent: "center",
})`
  inset: ${({ inset }) => inset};
  text-align: center;
  font-size: ${({ fontSize }) => fontSize};
`

export const Stats = () => {
  const { width, height } = useOnResize()
  const size = width < height ? width : height

  return (
    <>
      <StatsContainer fontSize={`${size / 15}px`} inset="50% 15% 0%">
        <Unit />
      </StatsContainer>
      <StatsContainer fontSize={`${size / 15}px`} inset="35% 15% 0%">
        <Value />
      </StatsContainer>
      <StatsContainer
        fontSize={`${size / 15}px`}
        inset={`90% ${(100 - ((size * 0.8) * 100) / width) / 2}% 0%`}
      >
        <Bounds />
      </StatsContainer>
    </>
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
    <ChartWrapper alignItems="center" justifyContent="start" ref={ref}>
      {loaded ? (
        <>
          <ChartContainer as="canvas" justifyContent="center" alignItems="center" />
          <Stats />
        </>
      ) : (
        <Skeleton />
      )}
    </ChartWrapper>
  )
})

export default withChart(Gauge, { tile: true })
