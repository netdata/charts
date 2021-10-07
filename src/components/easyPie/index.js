import React, { useState } from "react"
import ChartContainer from "@/components/chartContainer"
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
import { withChartProvider } from "@/components/provider"
import withChartTrack from "@/components/hocs/withChartTrack"
import withIntersection from "./withIntersection"
import withDifferedMount from "@/components/hocs/withDifferedMount"

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

const ChartWrapper = styled(ChartContainer)`
  position: absolute;
  inset: 0;
`

const StatsContainer = styled(Flex).attrs({
  position: "absolute",
  column: true,
  justifyContent: "between",
  alignContent: "center",
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
  background: "borderSecondary",
  position: "absolute",
  round: "100%",
})`
  inset: 0;
`

const Container = styled(Flex).attrs({ position: "relative" })`
  padding-bottom: 100%;
`

export const EasyPie = ({ ...rest }) => {
  const loaded = useAttributeValue("loaded")

  return (
    <Container {...rest}>
      {!loaded && <Skeleton />}
      {loaded && (
        <ChartWrapper>
          <Stats />
        </ChartWrapper>
      )}
    </Container>
  )
}

export default withChartProvider(withIntersection(withChartTrack(withDifferedMount(EasyPie))))
