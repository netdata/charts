import styled from "styled-components"
import { Flex, TextNano } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useUnitSign } from "@/components/provider"
import { NanoNumeral } from "@/components/modern/numerals"
import { Swatch, SquareSwatch } from "@/components/modern/swatch"
import { getScale, getThreshold, getThresholdColor } from "./scale"

const Ramp = styled(Flex).attrs({
  width: { base: 28, min: "0px" },
  flex: "shrink",
  overflow: "hidden",
  round: 0.75,
})`
  & > span {
    flex: 1 1 0;
  }
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
      gap={2}
      alignItems="center"
      width="100%"
      flexWrap
    >
      <TextNano strong truncate>
        {selectedContexts && selectedContexts !== "*" ? selectedContexts : contextScope}
      </TextNano>
      <Flex gap={2} alignItems="center" width={{ min: "0px" }}>
        <NanoNumeral color="textLite" whiteSpace="nowrap">
          {chart.getConvertedValue(min)} {units}
        </NanoNumeral>
        <Ramp data-testid="groupBox-legend-scale">
          {scale.map(color => (
            <Swatch key={color} swatchColor={color} height={2} />
          ))}
        </Ramp>
        <NanoNumeral color="textLite" whiteSpace="nowrap">
          {chart.getConvertedValue(max)} {units}
        </NanoNumeral>
      </Flex>
      {threshold !== null && (
        <Flex gap={1} alignItems="center" data-testid="groupBox-legend-threshold">
          <SquareSwatch swatchColor={getThresholdColor(chart)} />
          <NanoNumeral
            color="textLite"
            whiteSpace="nowrap"
          >{`≥ ${chart.getConvertedValue(threshold)} ${units}`}</NanoNumeral>
        </Flex>
      )}
    </Flex>
  )
}

export default ModernLegend
