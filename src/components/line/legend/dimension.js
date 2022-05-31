import React from "react"
import { useTheme } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import Color, { Color as ColorContainer } from "@/components/line/dimensions/color"
import Name, { Name as NameContainer } from "@/components/line/dimensions/name"
import Value, { Value as ValueContainer } from "@/components/line/dimensions/value"
import Units from "@/components/line/dimensions/units"
import { useVisibleDimensionId, useChart } from "@/components/provider"
import Tooltip from "@/components/tooltip"

const DimensionContainer = props => (
  <Flex
    width={{ min: 22, max: 40 }}
    flex={false}
    gap={1}
    data-testid="chartLegendDimension"
    {...props}
  />
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
  const visible = useVisibleDimensionId(id)
  const chart = useChart()

  const name = chart.getDimensionName(id)

  const onClick = e => {
    const merge = e.shiftKey || e.ctrlKey || e.metaKey
    chart.toggleDimensionId(id, { merge })
  }

  return (
    <DimensionContainer
      id={id}
      opacity={visible ? null : "weak"}
      cursor="pointer"
      onClick={onClick}
      data-track={chart.track(`dimension-${name}`)}
    >
      <Color id={id} />
      <Tooltip content={name}>
        <Flex flex column overflow="hidden" data-testid="chartLegendDimension-details">
          <Name id={id} maxLength={25} />

          <Flex gap={1} data-testid="chartLegendDimension-valueContainer" flex>
            <Value id={id} strong visible={visible} />
            <Units visible={visible} />
          </Flex>
        </Flex>
      </Tooltip>
    </DimensionContainer>
  )
}

export default Dimension
