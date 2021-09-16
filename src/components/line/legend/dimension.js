import React from "react"
import { useTheme } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Color, { Color as ColorContainer } from "@/components/line/dimensions/color"
import Name, { Name as NameContainer } from "@/components/line/dimensions/name"
import Value, { Value as ValueContainer } from "@/components/line/dimensions/value"
import { useUnitSign, useVisibleDimensionId, useChart } from "@/components/provider"

const DimensionContainer = props => (
  <Flex width="88px" flex={false} gap={1} data-testid="chartLegendDimension" {...props} />
)

export const SkeletonDimension = () => {
  const theme = useTheme()

  return (
    <DimensionContainer>
      <ColorContainer bg={getColor("placeholder")({ theme })} />
      <Flex flex gap={1} column overflow="hidden" data-testid="chartLegendDimension-details">
        <Flex height="10px" width="76px" background="borderSecondary" round />
        <Flex
          height="10px"
          width="34px"
          background="borderSecondary"
          round
          data-testid="chartLegendDimension-valueContainer"
        />
      </Flex>
    </DimensionContainer>
  )
}

export const EmptyDimension = () => {
  const theme = useTheme()

  return (
    <DimensionContainer>
      <ColorContainer bg={getColor("placeholder")({ theme })} />
      <Flex flex gap={1} column overflow="hidden" data-testid="chartLegendDimension-details">
        <NameContainer>No data</NameContainer>
        <ValueContainer>-</ValueContainer>
      </Flex>
    </DimensionContainer>
  )
}

const Dimension = ({ id }) => {
  const unit = useUnitSign()
  const visible = useVisibleDimensionId(id)
  const chart = useChart()

  const onClick = () => chart.onDimensionToggle(id)

  return (
    <DimensionContainer
      id={id}
      opacity={visible ? null : "weak"}
      cursor="pointer"
      onClick={onClick}
    >
      <Color id={id} />
      <Flex flex column overflow="hidden" data-testid="chartLegendDimension-details">
        <Name id={id} />

        <Flex gap={1} data-testid="chartLegendDimension-valueContainer">
          <Value id={id} strong visible={visible} />
          {visible && (
            <TextMicro whiteSpace="nowrap" truncate color="textDescription">
              {unit}
            </TextMicro>
          )}
        </Flex>
      </Flex>
    </DimensionContainer>
  )
}

export default Dimension
