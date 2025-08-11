import React from "react"
import { Flex } from "@netdata/netdata-ui"
import Legend from "@/components/line/legend"
import HeatmapColors from "@/components/line/legend/heatmapColors"
import DimensionSort from "@/components/line/dimensionSort"
import { useAttributeValue, usePayload, useIsMinimal } from "@/components/provider"
import Indicators from "@/components/line/indicators"
import { useIsHeatmap } from "@/helpers/heatmap"
import Drawer from "@/components/drawer"
import Expander from "./expander"

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
  const expanded = useAttributeValue("expanded")
  const legend = useAttributeValue("legend")

  usePayload()
  const isHeatmap = useIsHeatmap()
  const isMinimal = useIsMinimal()

  return (
    <Container data-testid="chartFooter">
      {!isMinimal && <Indicators />}
      {!showingInfo && legend && (
        <>
          {isHeatmap && <HeatmapColors />}
          <Flex alignItems="center" padding={isMinimal ? [2] : [0]}>
            {!isMinimal && !isHeatmap && <DimensionSort />}
            <Legend padding={isHeatmap ? [0, 2] : undefined} />
          </Flex>
        </>
      )}
      {expandable && expanded && <Drawer />}
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
