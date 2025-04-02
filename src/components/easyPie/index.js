import React from "react"
import styled, { keyframes } from "styled-components"
import { Flex, Text } from "@netdata/netdata-ui"
import ChartContainer from "@/components/chartContainer"
import {
  useUnitSign,
  useAttributeValue,
  useLatestConvertedValue,
  useOnResize,
  useDimensionIds,
} from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import textAnimation from "../helpers/textAnimation"

export const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
  ${({ isFetching }) => isFetching && textAnimation};
`

export const Value = () => {
  const value = useLatestConvertedValue("selected")

  return (
    <Label color="text" fontSize="3em" strong>
      {value}
    </Label>
  )
}

export const Unit = () => {
  const [firstDimId] = useDimensionIds()
  const unit = useUnitSign({ dimensionId: firstDimId })
  return (
    <Label color="textLite" fontSize="1.5em">
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
  <StatsContainer fontSize={`${size / 15}px`}>
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

export const EasyPie = ({ uiName, ref, ...rest }) => {
  const loaded = useAttributeValue("loaded")

  const { width, height } = useOnResize(uiName)
  const size = width < height ? width : height

  return (
    <ChartWrapper alignItems="center" ref={ref}>
      {loaded ? (
        <ChartContainer
          uiName={uiName}
          position="relative"
          justifyContent="center"
          alignItems="center"
          {...rest}
        >
          <Stats size={size} />
        </ChartContainer>
      ) : (
        <Skeleton size={size} />
      )}
    </ChartWrapper>
  )
}

export default withChart(EasyPie, { tile: true })
