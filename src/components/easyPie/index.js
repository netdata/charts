import React from "react"
import styled from "styled-components"
import { Flex, Text } from "@netdata/netdata-ui"
import ChartContainer from "@/components/chartContainer"
import {
  useAttributeValue,
  useIsModern,
  useLatestDisplayValueWithUnit,
  useOnResize,
  useVisibleDimensionIds,
} from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import ModernEasyPie from "@/components/modern/easyPie"
import textAnimation from "../helpers/textAnimation"
import { RingSkeleton } from "@/components/skeleton"

export const Label = styled(Text)`
  line-height: 1;
  font-size: ${({ fontSize }) => fontSize};
  ${({ isFetching }) => isFetching && textAnimation};
`

export const Value = () => {
  const [dimensionId] = useVisibleDimensionIds()
  const { convertedValue: value } = useLatestDisplayValueWithUnit(dimensionId)

  return (
    <Label color="text" fontSize="3em" strong>
      {value}
    </Label>
  )
}

export const Unit = () => {
  const [dimensionId] = useVisibleDimensionIds()
  const { convertedUnit: unit } = useLatestDisplayValueWithUnit(dimensionId)
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

export const Skeleton = () => <RingSkeleton width="100%" height="100%" />

export const EasyPie = ({ uiName, ref, ...rest }) => {
  const loaded = useAttributeValue("loaded")
  const isModern = useIsModern()

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
          {isModern ? <ModernEasyPie uiName={uiName} size={size} /> : <Stats size={size} />}
        </ChartContainer>
      ) : (
        <Skeleton />
      )}
    </ChartWrapper>
  )
}

export default withChart(EasyPie, { tile: true })
