import React, { useState } from "react"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useTitle,
  useUnitSign,
  useAttributeValue,
  useImmediateListener,
  useOnResize,
} from "@/components/provider"
import styled, { keyframes } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import { withChartProvider, useIsFetching, useLoadingColor } from "@/components/provider"
import withChartTrack from "@/components/hocs/withChartTrack"
import withIntersection from "./withIntersection"
import withDifferedMount from "@/components/hocs/withDifferedMount"
import textAnimation from "../helpers/textAnimation"

export const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
  ${({ isFetching }) => isFetching && textAnimation};
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
    <Label color="main" fontSize="2em">
      {value}
    </Label>
  )
}

export const Title = () => {
  const title = useTitle()
  const isFetching = useIsFetching()
  return (
    <Label color="border" fontSize="1.2em" strong isFetching={isFetching}>
      {title}
    </Label>
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

export const ChartWrapper = styled(ChartContainer)`
  position: absolute;
  inset: 0;
`

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
    <StatsContainer inset={`${width * 0.3}px 0`} fontSize={`${width / 15}px`}>
      <Title />
      <Value />
      <Unit />
    </StatsContainer>
  )
}

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 0.6; }
`

export const Skeleton = styled(Flex).attrs(props => ({
  background: "borderSecondary",
  position: "absolute",
  round: "100%",
  ...props,
}))`
  inset: 0;
  animation: ${frames} 1.6s ease-in infinite;
`

export const SkeletonIcon = () => {
  const color = useLoadingColor()
  return <Skeleton background={color} />
}

export const Container = styled(Flex).attrs({ position: "relative" })`
  padding-bottom: 100%;
`

export const EasyPie = props => {
  const loaded = useAttributeValue("loaded")

  return (
    <Container {...props}>
      {!loaded && <SkeletonIcon />}
      {loaded && (
        <ChartWrapper>
          <Stats />
        </ChartWrapper>
      )}
    </Container>
  )
}

export default withChartProvider(withIntersection(withChartTrack(withDifferedMount(EasyPie))))
