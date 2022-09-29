import React, { useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useTitle,
  useUnitSign,
  useImmediateListener,
  useOnResize,
} from "@/components/provider"
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

export const Title = props => {
  const title = useTitle()
  const isFetching = useIsFetching()

  return (
    <Label flex="1" color="border" fontSize="1.2em" strong isFetching={isFetching} {...props}>
      {title}
    </Label>
  )
}

const StrokeLabel = styled(Label)`
  text-shadow: 0.02em 0 ${getColor("borderSecondary")}, 0 0.02em ${getColor("borderSecondary")},
    -0.02em 0 ${getColor("borderSecondary")}, 0 -0.02em ${getColor("borderSecondary")};
`
export const Value = props => {
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
    <StrokeLabel flex="2" color="main" fontSize="2.2em" strong {...props}>
      {value}
    </StrokeLabel>
  )
}

export const Unit = props => {
  const unit = useUnitSign()
  return (
    <Label color="border" fontSize="1em" alignSelf="start" {...props}>
      {unit}
    </Label>
  )
}

export const StatsContainer = styled(Flex).attrs({
  position: "absolute",
  justifyContent: "between",
  alignContent: "center",
})`
  inset: 0 6%;
  text-align: center;
  font-size: ${({ fontSize }) => fontSize};
`

export const Stats = props => {
  const { width } = useOnResize()
  return (
    <StatsContainer fontSize={`${width / 20}px`} {...props}>
      <Title />
      <Flex>
        <Value size="large" />
        <Unit size="small" />
      </Flex>
    </StatsContainer>
  )
}

const Container = styled(Flex).attrs({ position: "relative" })`
  padding-bottom: 60%;
`

const ChartWrapper = styled.div`
  position: absolute;
  inset: 0;
`

export const NumberChart = props => (
  <Container {...props}>
    <ChartWrapper>
      <ChartContainer>
        <Stats />
      </ChartContainer>
    </ChartWrapper>
  </Container>
)

export default withChartProvider(withIntersection(withChartTrack(withDifferedMount(NumberChart))))
