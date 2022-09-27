import React, { useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useTitle,
  useInfo,
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

const Title = () => {
  const title = useTitle()
  // const isFetching = useIsFetching()
  return (
    <Label flex="1" color="text">
      {title}
    </Label>
  )
}

const Info = () => {
  const info = useInfo()
  return (
    <Label color="textDescription" fontSize="11px" textAlign="left">
      {info}
    </Label>
  )
}

const StrokeLabel = styled(Label)`
  text-shadow: 0.02em 0 ${getColor("borderSecondary")}, 0 0.02em ${getColor("borderSecondary")},
    -0.02em 0 ${getColor("borderSecondary")}, 0 -0.02em ${getColor("borderSecondary")};
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

  useImmediateListener(() => chart.getUI().on("rendered", () => setValue(getValue())), [])

  return (
    <StrokeLabel flex="2" color="main" fontSize="2.2em" strong>
      {value}
    </StrokeLabel>
  )
}

const Unit = () => {
  const unit = useUnitSign()
  return (
    <Label color="text" fontSize="1em" margin={[0.5]}>
      {unit}
    </Label>
  )
}

const StatsContainer = styled(Flex).attrs({
  position: "absolute",
  justifyContent: "center",
  alignContent: "center",
  height: "auto",
  width: "auto",
  margin: [4, 4, 0, 0],
  padding: [4],
})`
  inset: 0 6%;
  text-align: center;
  font-size: ${({ fontSize }) => fontSize};
`

const Stats = () => {
  const width = useOnResize()
  return (
    <StatsContainer fontSize={`${width / 20}px`}>
      <Value size="large" />
      <Unit size="small" />
    </StatsContainer>
  )
}

const Skeleton = styled(Flex).attrs({
  background: "borderSecondary",
  position: "absolute",
})`
  inset: ${getSizeBy(1)} ${getSizeBy(3)} ${getSizeBy(3)};
  border-top-left-radius: 100%;
  border-top-right-radius: 100%;
`

const Container = styled(Flex).attrs({ position: "relative" })`
  padding-bottom: 60%;
`

const ChartWrapper = styled.div`
  position: absolute;
  inset: 0;
`

export const NumberChart = props => {
  const loaded = useAttributeValue("loaded")

  return (
    <Container {...props}>
      {!loaded && <Skeleton />}
      {loaded && (
        <ChartWrapper>
          <ChartContainer>
            <Stats />
          </ChartContainer>
        </ChartWrapper>
      )}
    </Container>
  )
}

export default withChartProvider(withIntersection(withChartTrack(withDifferedMount(NumberChart))))
