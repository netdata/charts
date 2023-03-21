import React, { forwardRef, useState } from "react"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useUnitSign,
  useAttributeValue,
  useImmediateListener,
  useOnResize,
} from "@/components/provider"
import styled, { keyframes } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
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

export const Unit = () => {
  const unit = useUnitSign()
  return (
    <Label color="border" fontSize="1em">
      {unit}
    </Label>
  )
}

export const StatsContainer = styled(Flex).attrs({
  position: "absolute",
  column: true,
  alignContent: "center",
  justifyContent: "center",
  gap: 2,
})`
  inset: 0;
  text-align: center;
  font-size: ${({ fontSize }) => fontSize};
`

export const Stats = ({ size }) => (
  <StatsContainer fontSize={`${size / 12}px`}>
    <Value />
    <Unit />
  </StatsContainer>
)

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

export const EasyPie = forwardRef((props, ref) => {
  const loaded = useAttributeValue("loaded")

  const { width, height } = useOnResize()
  const size = width < height ? width : height

  return (
    <ChartWrapper alignItems="center" ref={ref}>
      {loaded ? (
        <ChartContainer position="relative" justifyContent="center" alignItems="center" {...props}>
          <Stats size={size} />
        </ChartContainer>
      ) : (
        <Skeleton size={size} />
      )}
    </ChartWrapper>
  )
})

export default withChart(EasyPie, { tile: true })
