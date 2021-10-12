import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Legend from "@/components/line/legend"
import DimensionFilter from "@/components/line/dimensionFilter"
import Resize from "@/components/line/resize"
import { useAttributeValue } from "@/components/provider/selectors"

export const Container = props => (
  <Flex border={{ side: "top", color: "borderSecondary" }} data-testid="chartLegend" {...props} />
)

const Footer = () => {
  const enabledHeightResize = useAttributeValue("enabledHeightResize")

  return (
    <Container>
      <DimensionFilter />
      <Legend />
      {enabledHeightResize && <Resize />}
    </Container>
  )
}

export default Footer
