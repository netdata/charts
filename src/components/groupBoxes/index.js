import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import withChart from "@/components/hocs/withChart"
import { useAttributeValue } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import Container from "./container"

const Skeleton = styled(Flex).attrs({
  background: "borderSecondary",
  flex: true,
  height: 50,
})``

export const GroupBoxesContainer = props => {
  const loaded = useAttributeValue("loaded")

  if (!loaded) return <Skeleton {...props} />

  return <ChartContainer as={Container} {...props} />
}

export default withChart(GroupBoxesContainer)
