import React from "react"
import { Text } from "@netdata/netdata-ui"
import ChartContainer from "@/components/chartContainer"
import {
  useLatestDisplayValueWithUnit,
  useOnResize,
  useVisibleDimensionIds,
} from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import FontSizer from "@/components/helpers/fontSizer"

export const Value = props => {
  const { width, height } = useOnResize()
  const [dimensionId] = useVisibleDimensionIds()
  const { convertedValue: value } = useLatestDisplayValueWithUnit(dimensionId)

  return (
    <FontSizer
      Component={Text}
      maxHeight={(height - 20) * 0.7}
      maxWidth={width - 20}
      lineHeight="1.1em"
      strong
      {...props}
    >
      {value}
    </FontSizer>
  )
}

export const Unit = props => {
  const { width, height } = useOnResize()
  const [dimensionId] = useVisibleDimensionIds()
  const { convertedUnit: unit } = useLatestDisplayValueWithUnit(dimensionId)

  if (!unit) return null

  return (
    <FontSizer
      Component={Text}
      maxHeight={(height - 20) * 0.25}
      maxWidth={(width - 20) * 0.7}
      fontSize="1.1em"
      strong
      color="textLite"
      {...props}
    >
      {unit}
    </FontSizer>
  )
}

export const NumberChart = ({ uiName, ref, ...rest }) => (
  <ChartWrapper ref={ref}>
    <ChartContainer
      uiName={uiName}
      column
      alignItems="center"
      justifyContent="center"
      position="relative"
      {...rest}
    >
      <Value />
      <Unit />
    </ChartContainer>
  </ChartWrapper>
)

export default withChart(NumberChart, { tile: true })
