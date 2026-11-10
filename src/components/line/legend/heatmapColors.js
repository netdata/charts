import React, { useMemo } from "react"
import styled from "styled-components"
import { TextNano, Flex } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useUnitSign, usePayload } from "@/components/provider"
import { getHeatmapPalette, getHeatmapMax, isLogColorScale } from "@/helpers/heatmap"

const ColorScaleBar = styled(Flex).attrs({ width: "320px", height: "12px", round: true })`
  background: linear-gradient(to right, ${({ $colors }) => $colors.join(", ")});
`

const HeatmapColorsLegend = () => {
  const chart = useChart()
  usePayload()
  useAttributeValue("max")
  const max = getHeatmapMax(chart)
  const units = useUnitSign()
  const theme = useAttributeValue("theme")
  const palette = useAttributeValue("heatmapPalette")
  useAttributeValue("heatmapColorScale")
  const log = isLogColorScale(chart)

  const colors = useMemo(() => getHeatmapPalette(chart), [chart, palette, theme])

  return (
    <Flex data-testid="heatmap-legend" gap={2} alignItems="center" padding={[2]}>
      <TextNano>
        {chart.getConvertedValue(0)} {units}
      </TextNano>
      <ColorScaleBar $colors={colors} data-testid="heatmap-legend-scale" />
      <TextNano>{`${chart.getConvertedValue(max)} ${units}${log ? " (log scale)" : ""}`}</TextNano>
    </Flex>
  )
}

export default HeatmapColorsLegend
