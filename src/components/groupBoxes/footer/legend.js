import React from "react"
import styled from "styled-components"
import { Flex, TextNano } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useUnitSign } from "@/components/provider"

const LinearColorScaleBar = styled(Flex).attrs({
  width: { max: "320px", base: "100%" },
  height: "12px",
  round: true,
})`
  background: linear-gradient(
    to right,
    ${({ minColor }) => minColor},
    ${({ maxColor }) => maxColor}
  );
`

const Legend = () => {
  const chart = useChart()
  const min = useAttributeValue("min")
  const max = useAttributeValue("max")
  const units = useUnitSign()

  const selectedContexts = useAttributeValue("selectedContexts").join(", ")
  const contextScope = useAttributeValue("contextScope").join(", ")

  useAttributeValue("theme") // rerender on theme change
  const minColor = chart.getThemeAttribute("themeGroupBoxesMin")
  const maxColor = chart.getThemeAttribute("themeGroupBoxesMax")

  return (
    <Flex data-testid="groupBox-legend" gap={4} alignItems="center" width="100%">
      <TextNano strong>
        {selectedContexts && selectedContexts !== "*" ? selectedContexts : contextScope}
      </TextNano>
      <Flex gap={2} alignItems="center" width="100%">
        <TextNano>
          {chart.getConvertedValue(min)} {units}
        </TextNano>
        <LinearColorScaleBar minColor={minColor} maxColor={maxColor} />
        <TextNano>
          {chart.getConvertedValue(max)} {units}
        </TextNano>
      </Flex>
    </Flex>
  )
}

export default Legend
