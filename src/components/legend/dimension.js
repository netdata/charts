import React, { useEffect, useState } from "react"
import { useTheme } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { getColor } from "@netdata/netdata-ui/lib/theme/utils"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import Color, { Container as ColorContainer } from "@/components/dimensions/color"
import Name from "@/components/dimensions/name"
import Value from "@/components/dimensions/value"

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

const Dimension = ({ chart, id }) => {
  const [unit, setUnit] = useState(chart.getUnitSign)

  useEffect(() => chart.on("convertedValuesChange", () => setUnit(chart.getUnitSign)), [])

  return (
    <DimensionContainer>
      <Color chart={chart} id={id} />
      <Flex flex column overflow="hidden" data-testid="chartLegendDimension-details">
        <Name chart={chart} id={id} />
        <Flex gap={1} data-testid="chartLegendDimension-valueContainer">
          <Value chart={chart} id={id} strong />
          <TextMicro whiteSpace="nowrap" truncate>
            {unit}
          </TextMicro>
        </Flex>
      </Flex>
    </DimensionContainer>
  )
}

export default Dimension
