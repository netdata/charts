import React from "react"
import { Box, Flex } from "@netdata/netdata-ui"
import Legend from "@/components/line/legend"
import DimensionSort from "@/components/line/dimensionSort"
import Resize from "@/components/line/resize"
import { useAttributeValue } from "@/components/provider/selectors"
import Indicators from "@/components/line/indicators"
import Drawer from "../drawer"
import Expander from "./expander"

export const Container = props => (
  <Flex
    border={{ side: "top", color: "borderSecondary" }}
    data-testid="chartLegend"
    column
    {...props}
  />
)

const ResizeHandler = () => {
  const enabledHeightResize = useAttributeValue("enabledHeightResize")

  if (!enabledHeightResize) return null

  return (
    <Box position="absolute" right={0} bottom="-4px">
      <Resize />
    </Box>
  )
}

const Footer = () => {
  const showingInfo = useAttributeValue("showingInfo")
  const expanded = useAttributeValue("expanded")
  const expandable = useAttributeValue("expandable")

  return (
    <Container>
      <Indicators />
      {!showingInfo && (
        <>
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
