import React, { useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useTitle,
  useUnitSign,
  useAttributeValue,
  useImmediateListener,
  useOnResize,
} from "@/components/provider"
import { getSizeBy } from "@netdata/netdata-ui/lib/theme/utils"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import { withChartProvider, useIsFetching } from "@/components/provider"
import withChartTrack from "@/components/hocs/withChartTrack"
import withIntersection from "./withIntersection"
import withDifferedMount from "@/components/hocs/withDifferedMount"
import textAnimation from "../helpers/textAnimation"

const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
  flex: ${({ flex = 0 }) => flex};
  ${({ isFetching }) => isFetching && textAnimation};
`

export const Title = () => {
  const title = useTitle()
  const isFetching = useIsFetching()
  return (
    <Label flex="1" color="border" fontSize="1.2em" strong isFetching={isFetching}>
      {title}
    </Label>
  )
}
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
    <Label color="border" fontSize="1em" alignSelf="start">
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
    <StatsContainer inset="0 6%" fontSize={`${width / 20}px`}>
      <Title />
      <Value />
      <Bounds />
      <Unit />
    </StatsContainer>
  )
}

export const Skeleton = styled(Flex).attrs({
  background: "borderSecondary",
  position: "absolute",
})`
  inset: ${getSizeBy(1)} ${getSizeBy(3)} ${getSizeBy(3)};
  border-top-left-radius: 100%;
  border-top-right-radius: 100%;
`

export const Container = styled(Flex).attrs({ position: "relative" })`
  padding-bottom: 60%;
`

export const ChartWrapper = styled.div`
  position: absolute;
  inset: 0;
`

export const Gauge = props => {
  const loaded = useAttributeValue("loaded")

  return (
    <Container {...props}>
      {!loaded && <Skeleton />}
      {loaded && (
        <ChartWrapper>
          <ChartContainer as="canvas" />
          <Stats />
        </ChartWrapper>
      )}
    </Container>
  )
}

export default withChartProvider(withIntersection(withChartTrack(withDifferedMount(Gauge))))
