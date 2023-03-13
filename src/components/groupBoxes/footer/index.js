import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Legend from "@/components/groupBoxes/legend"
import Indicators from "@/components/line/indicators"

export const Container = props => (
  <Flex
    border={{ side: "top", color: "borderSecondary" }}
    data-testid="chartLegend"
    column
    {...props}
  />
)

const Footer = () => (
  <Container>
    <Indicators />
    <Flex alignItems="center" padding={[2]}>
      <Legend />
    </Flex>
  </Container>
)

export default Footer
