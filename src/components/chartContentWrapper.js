import React, { forwardRef } from "react"
import styled, { css } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useInitialLoading, useEmpty, useAttributeValue } from "@/components/provider"
import { CenterNoData } from "./overlays/proceeded"
import Tooltip from "./tooltip"
import Toolbox from "./toolbox"
import { useHovered } from "./useHover"
import ChartContainer from "./chartContainer"
import SkeletonChart from "./skeletonChart"
import Overlays from "./overlays"
import dygraphStyle from "@/chartLibraries/dygraph/style.css"

const chartLibraries = {
  dygraph: css`
    ${dygraphStyle}
  `,
}

const StyledContainer = styled(Flex)`
  ${({ chartLibrary }) => chartLibraries[chartLibrary] || ""}
`

export const Container = forwardRef((props, ref) => {
  const chartLibrary = useAttributeValue("chartLibrary")

  return (
    <StyledContainer
      ref={ref}
      chartLibrary={chartLibrary}
      position="relative"
      padding={[0, 0, 2]}
      flex
      data-testid="chartContentWrapper"
      height="100%"
      {...props}
    />
  )
})

const ChartContentWrapper = () => {
  const [ref, hovered] = useHovered({
    isOut: node => !node || !node.closest("[data-toolbox]"),
  })
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  return (
    <Container ref={ref}>
      {!initialLoading && !empty && <ChartContainer />}
      {!initialLoading && !empty && <Overlays />}
      {!initialLoading && empty && <CenterNoData />}
      {initialLoading && <SkeletonChart />}
      {hovered && !empty && <Toolbox />}
      <Tooltip />
    </Container>
  )
}

export default ChartContentWrapper
