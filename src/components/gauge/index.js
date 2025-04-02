import React from "react"
import styled, { keyframes } from "styled-components"
import { Flex, Text, getColor } from "@netdata/netdata-ui"
import ChartContainer from "@/components/chartContainer"
import {
  useChart,
  useUnitSign,
  useAttributeValue,
  useOnResize,
  useLatestConvertedValue,
  useDimensionIds,
} from "@/components/provider"
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
  text-shadow:
    0.02em 0 ${getColor("border")},
    0 0.02em ${getColor("border")},
    -0.02em 0 ${getColor("border")},
    0 -0.02em ${getColor("border")};
`

export const Value = () => {
  const value = useLatestConvertedValue("selected")

  return (
    <StrokeLabel flex="2" color="text" fontSize="2em" strong>
      {value}
    </StrokeLabel>
  )
}

export const Unit = () => {
  const [firstDimId] = useDimensionIds()
  const unit = useUnitSign({ dimensionId: firstDimId })
  return (
    <Label color="textLite" fontSize="1em">
      {unit}
    </Label>
  )
}

export const Bound = ({ empty, index, uiName, ...rest }) => {
  const chart = useChart()
  const minMax = chart.getUI(uiName).getMinMax()

  return (
    <Label color="textLite" fontSize="1.3em" {...rest}>
      {empty ? "-" : chart.getConvertedValue(minMax[index])}
    </Label>
  )
}

export const BoundsContainer = styled(Flex).attrs({
  alignItems: "center",
  justifyContent: "between",
  flex: true,
})``

export const Bounds = ({ uiName }) => (
  <BoundsContainer>
    <Bound index={0} uiName={uiName} />
    <Bound index={1} uiName={uiName} />
  </BoundsContainer>
)

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

export const Stats = ({ uiName }) => {
  const { width, height } = useOnResize(uiName)
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
        inset={`80% ${(100 - (size * 0.8 * 100) / width) / 2}% 0%`}
      >
        <Bounds uiName={uiName} />
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

export const Gauge = ({ uiName, ref, ...rest }) => {
  const loaded = useAttributeValue("loaded")

  return (
    <ChartWrapper alignItems="center" justifyContent="center" column ref={ref} gap={0}>
      {loaded ? (
        <>
          <ChartContainer
            uiName={uiName}
            position="relative"
            justifyContent="center"
            alignItems="center"
            overflow="hidden"
            {...rest}
          >
            <canvas />
          </ChartContainer>
          <Stats uiName={uiName} />
        </>
      ) : (
        <Skeleton />
      )}
    </ChartWrapper>
  )
}

export default withChart(Gauge, { tile: true })
