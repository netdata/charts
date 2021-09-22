import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Legend from "@/components/line/legend"
import DimensionFilter from "@/components/line/dimensionFilter"
import Resize from "@/components/line/resize"

export const Container = props => (
  <Flex border={{ side: "top", color: "borderSecondary" }} data-testid="chartLegend" {...props} />
)

const Footer = () => (
  <Container>
    <DimensionFilter />
    <Legend />
    <Resize />
  </Container>
)

export default Footer
