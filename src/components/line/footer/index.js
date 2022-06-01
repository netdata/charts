import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Legend from "@/components/line/legend"
import DimensionFilter from "@/components/line/dimensionFilter"
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
        <DimensionFilter />
        <Legend />
        {enabledHeightResize && <Resize />}
      </Flex>
    </Container>
  )
}

export default Footer
