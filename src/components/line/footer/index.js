import React from "react"
import { Box, Flex } from "@netdata/netdata-ui"
import Legend from "@/components/line/legend"
import HeatmapColors from "@/components/line/legend/heatmapColors"
import DimensionSort from "@/components/line/dimensionSort"
import Resize from "@/components/line/resize"
import { useAttributeValue } from "@/components/provider/selectors"
import Indicators from "@/components/line/indicators"
import Drawer from "../drawer"
import Expander from "./expander"
import { useIsHeatmap } from "@/helpers/heatmap"

export const Container = props => (
  <Flex
    border={{ side: "top", color: "borderSecondary" }}
    data-testid="chartLegend"
    column
    {...props}
  />
)

const getCursor = (enabledHeightResize, enabledWidthResize) =>
  enabledHeightResize && enabledWidthResize
    ? "nwse-resize"
    : enabledHeightResize
    ? "ns-resize"
    : "ew-resize"

const ResizeHandler = () => {
  const enabledHeightResize = useAttributeValue("enabledHeightResize")
  const enabledWidthResize = useAttributeValue("enabledWidthResize")

  if (!enabledHeightResize && !enabledWidthResize) return null

  return (
    <Box position="absolute" right={0} bottom="-4px">
      <Resize cursor={getCursor(enabledHeightResize, enabledWidthResize)} />
    </Box>
  )
}

const Footer = () => {
  const showingInfo = useAttributeValue("showingInfo")
  const expanded = useAttributeValue("expanded")
  const expandable = useAttributeValue("expandable")
  const isHeatmap = useIsHeatmap()

  return (
    <Container>
      <Indicators />
      {!showingInfo && (
        <>
          {isHeatmap && <HeatmapColors />}
          <Flex alignItems="center">
            <DimensionSort />
            <Legend />
          </Flex>

          {expanded && <Drawer />}
        </>
      )}
      {expandable ? (
        <Flex
          flex
          position="relative"
          alignItems="center"
          justifyContent="center"
          border={{ side: "top", color: "borderSecondary" }}
        >
          <Expander />
          <ResizeHandler />
        </Flex>
      ) : (
        <ResizeHandler />
      )}
    </Container>
  )
}

export default Footer
