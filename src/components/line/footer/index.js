import React from "react"
import { Flex } from "@netdata/netdata-ui"
import Legend from "@/components/line/legend"
import HeatmapColors from "@/components/line/legend/heatmapColors"
import DimensionSort from "@/components/line/dimensionSort"
import { useAttributeValue, usePayload, useIsMinimal } from "@/components/provider"
import Indicators from "@/components/line/indicators"
import Expander from "./expander"
import { useIsHeatmap } from "@/helpers/heatmap"

export const Container = props => (
  <Flex
    border={{ side: "top", color: "borderSecondary" }}
    data-testid="chartLegend"
    column
    position="relative"
    {...props}
  />
)

const Footer = () => {
  const showingInfo = useAttributeValue("showingInfo")
  const expandable = useAttributeValue("expandable")

  usePayload()
  const isHeatmap = useIsHeatmap()
  const isMinimal = useIsMinimal()

  return (
    <Container>
      {!isMinimal && <Indicators />}
      {!showingInfo && (
        <>
          {isHeatmap && <HeatmapColors />}
          <Flex alignItems="center" padding={isMinimal ? [2] : [0]}>
            {!isMinimal && !isHeatmap && <DimensionSort />}
            <Legend padding={isHeatmap ? [0, 2] : undefined} />
          </Flex>
        </>
      )}
      {expandable && (
        <Flex
          flex
          position="relative"
          alignItems="center"
          justifyContent="center"
          border={{ side: "top", color: "borderSecondary" }}
        >
          <Expander />
        </Flex>
      )}
    </Container>
  )
}

export default Footer
