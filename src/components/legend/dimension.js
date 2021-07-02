import React from "react"
import { useTheme } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Color, { Color as ColorContainer } from "@/components/dimensions/color"
import Name, { Name as NameContainer } from "@/components/dimensions/name"
import Value, { Value as ValueContainer } from "@/components/dimensions/value"
import { useUnitSign } from "@/components/provider"

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

  return (
    <DimensionContainer>
      <Color id={id} />
      <Flex flex column overflow="hidden" data-testid="chartLegendDimension-details">
        <Name id={id} />
        <Flex gap={1} data-testid="chartLegendDimension-valueContainer">
          <Value id={id} strong />
          <TextMicro whiteSpace="nowrap" truncate color="textDescription">
            {unit}
          </TextMicro>
        </Flex>
      </Flex>
    </DimensionContainer>
  )
}

export default Dimension
