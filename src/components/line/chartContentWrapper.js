import React, { forwardRef } from "react"
import styled, { css } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useInitialLoading, useEmpty, useAttributeValue } from "@/components/provider"
import { useHovered } from "@/components/useHover"
import ChartContainer from "@/components/chartContainer"
import Popover from "./popover"
import Toolbox from "./toolbox"
import Skeleton from "./skeleton"
import Overlays from "./overlays"
import dygraphStyle from "@/chartLibraries/dygraph/style.css"
import cursorStyle from "@/components/helpers/cursorStyle"

const chartLibraries = {
  dygraph: css`
    ${dygraphStyle}
    ${cursorStyle}
  `,
}

const StyledContainer = styled(Flex)`
  ${({ chartLibrary }) => chartLibraries[chartLibrary] || ""}
`

export const ContentWrapper = props => (
  <Flex position="relative" column flex overflow="hidden" data-testid="contentWrapper" {...props} />
)

export const Container = forwardRef((props, ref) => {
  const chartLibrary = useAttributeValue("chartLibrary")
  const navigation = useAttributeValue("navigation")

  return (
    <StyledContainer
      ref={ref}
      chartLibrary={chartLibrary}
      position="relative"
      flex
      data-testid="chartContentWrapper"
      height="100%"
      overflow="hidden"
      navigation={navigation}
      {...props}
    />
  )
})

const ChartContentWrapper = ({ uiName }) => {
  const [ref, hovered] = useHovered({
    isOut: node => !node || !node.closest("[data-toolbox]"),
  })
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  const hasToolbox = useAttributeValue("hasToolbox")

  return (
    <Container ref={ref}>
      {!initialLoading && <ChartContainer />}
      {!initialLoading && <Overlays uiName={uiName} />}
      {initialLoading && <Skeleton />}
      {hasToolbox && hovered && !empty && <Toolbox />}
      <Popover uiName={uiName} />
    </Container>
  )
}

export default ChartContentWrapper
