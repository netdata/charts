import React from "react"
import styled from "styled-components"
import { TextNano, Flex } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useUnitSign } from "@/components/provider"

const LinearColorScaleBar = styled(Flex).attrs({ width: "320px", height: "12px", round: true })`
  background: linear-gradient(
    to right,
    rgb(62, 73, 137),
    rgb(49, 104, 142),
    rgb(38, 130, 142),
    rgb(31, 158, 137),
    rgb(53, 183, 121),
    rgb(110, 206, 88),
    rgb(181, 222, 43),
    rgb(253, 231, 37)
  );
`

const HeatmapColorsLegend = () => {
  const chart = useChart()
  const max = useAttributeValue("max")
  const units = useUnitSign()

  useAttributeValue("theme") // rerender on theme change

  return (
    <Flex data-testid="heatmap-legend" gap={2} alignItems="center" padding={[2, 11]}>
      <TextNano>
        {chart.getConvertedValue(0)} {units}
      </TextNano>
      <LinearColorScaleBar />
      <TextNano>
        {chart.getConvertedValue(max)} {units}
      </TextNano>
    </Flex>
  )
}

export default HeatmapColorsLegend
