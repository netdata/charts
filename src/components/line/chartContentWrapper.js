import React, { forwardRef } from "react"
import styled, { css } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useInitialLoading, useEmpty, useAttributeValue } from "@/components/provider"
import { useHovered } from "@/components/useHover"
import ChartContainer from "@/components/chartContainer"
import { CenterNoData } from "./overlays/proceeded"
import Tooltip from "./tooltip"
import Toolbox from "./toolbox"
import Skeleton from "./skeleton"
import Overlays from "./overlays"
import dygraphStyle from "@/chartLibraries/dygraph/style.css"
import cursorStyle from "@/helpers/makeKeyboardListener/style.js"

const chartLibraries = {
  dygraph: css`
    ${dygraphStyle}
    ${cursorStyle}
  `,
}

const StyledContainer = styled(Flex)`
  ${({ chartLibrary }) => chartLibraries[chartLibrary] || ""}
`

export const Container = forwardRef((props, ref) => {
  const chartLibrary = useAttributeValue("chartLibrary")
  const navigation = useAttributeValue("navigation")

  return (
    <StyledContainer
      ref={ref}
      chartLibrary={chartLibrary}
      position="relative"
      padding={[0, 0, 2]}
      flex
      data-testid="chartContentWrapper"
      height="100%"
      navigation={navigation}
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
      {initialLoading && <Skeleton />}
      {hovered && !empty && <Toolbox />}
      <Tooltip />
    </Container>
  )
}

export default ChartContentWrapper
