import React from "react"
import withChart from "@/components/hocs/withChart"
import { useAttributeValue } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

const Skeleton = styled(Flex).attrs({
  background: "borderSecondary",
  flex: true,
  height: 50,
})``

export const UPlot = props => {
  const loaded = useAttributeValue("loaded")

  if (!loaded) return <Skeleton {...props} />

  return <ChartContainer {...props} />
}

export default withChart(UPlot)
