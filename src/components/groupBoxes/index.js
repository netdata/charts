import React from "react"
import styled, { keyframes } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import withChart from "@/components/hocs/withChart"
import { useAttributeValue, useLoadingColor } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import FilterToolbox from "@/components/line/filterToolbox"
import Container from "./container"

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 0.6; }
`

const Skeleton = styled(Flex).attrs(props => ({
  background: "borderSecondary",
  flex: true,
  height: 50,
  ...props,
}))`
  animation: ${frames} 1.6s ease-in infinite;
`

export const SkeletonIcon = () => {
  const color = useLoadingColor()
  return <Skeleton background={color} />
}

export const GroupBoxesContainer = props => {
  const loaded = useAttributeValue("loaded")

  if (!loaded) return <SkeletonIcon {...props} />

  return (
    <Flex column>
      <FilterToolbox />
      <ChartContainer as={Container} {...props} />
    </Flex>
  )
}

export default withChart(GroupBoxesContainer)
