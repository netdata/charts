import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Legend from "@/components/line/legend"
import DimensionSort from "@/components/line/dimensionSort"
import Resize from "@/components/line/resize"
import { useAttributeValue } from "@/components/provider/selectors"
import Indicators from "@/components/line/indicators"

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

  return (
    <Container>
      <Indicators />
      <Flex alignItems="center">
        <DimensionSort />
        <Legend />
        {enabledHeightResize && <Resize />}
      </Flex>
    </Container>
  )
}

export default Footer
