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

const Footer = () => {
  const enabledHeightResize = useAttributeValue("enabledHeightResize")
  const showingInfo = useAttributeValue("showingInfo")
  const expanded = useAttributeValue("expanded")

  return (
    <Container>
      <Indicators />
      {!showingInfo &&
        (!expanded ? (
          <Flex alignItems="center">
            <DimensionSort />
            <Legend />
          </Flex>
        ) : (
          <Drawer />
        ))}
      <Flex
        flex
        position="relative"
        alignItems="center"
        justifyContent="center"
        border={{ side: "top", color: "borderSecondary" }}
      >
        <Expander />
        {enabledHeightResize && (
          <Box position="absolute" right={0} bottom="-4px">
            <Resize />
          </Box>
        )}
      </Flex>
    </Container>
  )
}

export default Footer
