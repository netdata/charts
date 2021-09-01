import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import withChart from "@/components/hocs/withChart"
import { useAttributeValue } from "@/components/provider"
import GroupBoxes from "./groupBoxes"

const Skeleton = styled(Flex).attrs({
  background: "borderSecondary",
  flex: true,
})``

export const Kubernetes = props => {
  const loaded = useAttributeValue("loaded")

  if (!loaded) return <Skeleton {...props} />

  return <GroupBoxes {...props} />
}

export default withChart(Kubernetes)
