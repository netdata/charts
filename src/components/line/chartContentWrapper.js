import React from "react"
import styled, { css } from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useInitialLoading, useEmpty, useAttributeValue } from "@/components/provider"
import { useHovered } from "@/components/useHover"
import ChartContainer from "@/components/chartContainer"
import Popover from "./popover"
import NavigationToolbox from "./navigationToolbox"
import Skeleton from "./skeleton"
import Overlays from "./overlays"
import { Processing } from "./overlays/proceeded"
import cursorStyle from "@/components/helpers/cursorStyle"

const chartLibraries = {
  dygraph: css`
    & {
      .default .dygraph-axis-label {
        color: #35414a;
      }

      .dark .dygraph-axis-label {
        color: #fff;
      }

      .dygraph-label-rotate-right {
        text-align: center;
        /* See http://caniuse.com/#feat=transforms2d */
        transform: rotate(-90deg);
        -webkit-transform: rotate(-90deg);
        -moz-transform: rotate(-90deg);
        -o-transform: rotate(-90deg);
        -ms-transform: rotate(-90deg);
      }

      .dygraph-annotation {
        position: absolute;
        z-index: 10;
        overflow: hidden;
        border: 1px solid;
      }
    }

    ${cursorStyle}
  `,
}

const StyledContainer = styled(Flex)`
  ${({ chartLibrary }) => chartLibraries[chartLibrary] || ""}
`

export const ContentWrapper = props => (
  <Flex position="relative" column flex overflow="hidden" data-testid="contentWrapper" {...props} />
)

export const Container = props => {
  const chartLibrary = useAttributeValue("chartLibrary")
  const navigation = useAttributeValue("navigation")

  return (
    <StyledContainer
      chartLibrary={chartLibrary}
      position="relative"
      flex
      data-testid="chartContentWrapper"
      height="100%"
      width="100%"
      overflow="hidden"
      navigation={navigation}
      {...props}
    />
  )
}

const ChartContentWrapper = ({ uiName }) => {
  const id = useAttributeValue("id")

  const [ref, hovered] = useHovered({
    isOut: node =>
      !node || (!node.closest(`[data-toolbox="${id}"]`) && !node.closest(`[data-chartid="${id}"]`)),
  })
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  const hasToolbox = useAttributeValue("hasToolbox")
  const hasHoverPopover = useAttributeValue("hasHoverPopover")
  const processing = useAttributeValue("processing")

  return (
    <Container ref={ref}>
      {!initialLoading && <ChartContainer />}
      {!initialLoading && <Overlays uiName={uiName} />}
      {initialLoading && <Skeleton />}
      {hasToolbox && hovered && !empty && <NavigationToolbox />}
      {processing && <Processing />}
      {hasHoverPopover && <Popover uiName={uiName} />}
    </Container>
  )
}

export default ChartContentWrapper
