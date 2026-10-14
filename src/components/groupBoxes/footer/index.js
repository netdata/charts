import React from "react"
import { Flex } from "@netdata/netdata-ui"
import Indicators from "@/components/line/indicators"
import { useIsModern } from "@/components/provider"
import ModernLegend from "@/components/modern/groupBoxes/legend"
import Legend from "./legend"

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
  const isModern = useIsModern()

  return (
    <Container>
      <Indicators />
      <Flex alignItems="center" padding={[2]}>
        {isModern ? <ModernLegend /> : <Legend />}
      </Flex>
    </Container>
  )
}

export default Footer
