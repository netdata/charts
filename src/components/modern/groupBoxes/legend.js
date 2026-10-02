import React from "react"
import styled from "styled-components"
import { Box, Flex, TextNano } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useUnitSign } from "@/components/provider"
import { numeralsFont, tabularNumbers } from "@/components/modern/tokens"
import { getScale, getThreshold, getThresholdColor } from "./scale"

const Swatch = styled(Box).attrs({ as: "span", width: 4, height: 2 })`
  display: inline-block;
`

const Ramp = styled(Flex).attrs({ flex: false, overflow: "hidden" })`
  border-radius: 3px;
`

const Numeral = styled(TextNano)`
  font-family: ${numeralsFont};
  ${tabularNumbers}
`

const ModernLegend = () => {
  const chart = useChart()
  const min = useAttributeValue("min")
  const max = useAttributeValue("max")
  useAttributeValue("theme")
  useAttributeValue("groupBoxesThreshold")
  const units = useUnitSign()

  const selectedContexts = useAttributeValue("selectedContexts").join(", ")
  const contextScope = useAttributeValue("contextScope").join(", ")

  const scale = getScale(chart)
  const threshold = getThreshold(chart)

  return (
    <Flex
      data-testid="groupBox-legend"
      data-flavour="modern"
      gap={4}
      alignItems="center"
      width="100%"
      flexWrap
    >
      <TextNano strong>
        {selectedContexts && selectedContexts !== "*" ? selectedContexts : contextScope}
      </TextNano>
      <Flex gap={2} alignItems="center">
        <Numeral color="textLite">
          {chart.getConvertedValue(min)} {units}
        </Numeral>
        <Ramp data-testid="groupBox-legend-scale">
          {scale.map(color => (
            <Swatch key={color} style={{ background: color }} />
          ))}
        </Ramp>
        <Numeral color="textLite">
          {chart.getConvertedValue(max)} {units}
        </Numeral>
      </Flex>
      {threshold !== null && (
        <Flex gap={1} alignItems="center" data-testid="groupBox-legend-threshold">
          <Swatch style={{ background: getThresholdColor(chart), borderRadius: 2, width: 8 }} />
          <Numeral color="textLite">{`≥ ${chart.getConvertedValue(threshold)} ${units}`}</Numeral>
        </Flex>
      )}
    </Flex>
  )
}

export default ModernLegend
