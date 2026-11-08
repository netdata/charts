import React from "react"
import { Flex } from "@netdata/netdata-ui"
import Indicators from "@/components/line/indicators"
import { useAttributeValue, useIsModern } from "@/components/provider"
import ModernLegend from "@/components/modern/groupBoxes/legend"
import { Highlight, Timestamp } from "@/components/modern/legend/readouts"
import useGroupBoxRowData from "../useGroupBoxRowData"
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

const ModernFooter = ({ uiName }) => {
  const row = useGroupBoxRowData(uiName)
  const hover = useAttributeValue("hoverX")

  return (
    <Container flex={false} gap={1} padding={[1, 6, 1, 2]}>
      <ModernLegend />
      <Flex alignItems="center" gap={2} flexWrap>
        <Highlight />
        <Timestamp label={hover ? "Hovering" : "Latest"} timestamp={row?.[0]} />
      </Flex>
    </Container>
  )
}

const Footer = ({ uiName }) => {
  const isModern = useIsModern()
  if (isModern) return <ModernFooter uiName={uiName} />

  return (
    <Container>
      <Indicators />
      <Flex alignItems="center" padding={[2]}>
        <Legend />
      </Flex>
    </Container>
  )
}

export default Footer
