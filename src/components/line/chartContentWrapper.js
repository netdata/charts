import React from "react"
import styled, { css } from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import { useInitialLoading, useAttributeValue } from "@/components/provider"
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
  uplot: css`
    & {
      .uplot,
      .uplot *,
      .uplot *::before,
      .uplot *::after {
        box-sizing: border-box;
      }

      .u-wrap {
        position: relative;
        user-select: none;
      }

      .u-over,
      .u-under {
        position: absolute;
      }

      .u-under {
        overflow: hidden;
      }

      .uplot canvas {
        display: block;
        position: relative;
        width: 100%;
        height: 100%;
      }

      .u-axis {
        position: absolute;
      }

      .u-select {
        background: rgba(128, 128, 128, 0.3);
        position: absolute;
        pointer-events: none;
      }

      .u-cursor-x,
      .u-cursor-y {
        position: absolute;
        left: 0;
        top: 0;
        pointer-events: none;
        will-change: transform;
      }

      .u-hz .u-cursor-x,
      .u-vt .u-cursor-y {
        height: 100%;
        border-right: 1px dashed #607d8b;
      }

      .u-hz .u-cursor-y,
      .u-vt .u-cursor-x {
        width: 100%;
        border-bottom: 1px dashed #607d8b;
      }

      .u-cursor-pt {
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 50%;
        border: 0 solid;
        pointer-events: none;
        will-change: transform;
        background-clip: padding-box !important;
      }

      .u-axis.u-off,
      .u-select.u-off,
      .u-cursor-x.u-off,
      .u-cursor-y.u-off,
      .u-cursor-pt.u-off {
        display: none;
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
  const hasToolbox = useAttributeValue("hasToolbox")
  const hasHoverPopover = useAttributeValue("hasHoverPopover")
  const processing = useAttributeValue("processing")

  return (
    <Container ref={ref}>
      {!initialLoading && <ChartContainer />}
      {!initialLoading && <Overlays uiName={uiName} />}
      {initialLoading && <Skeleton />}
      {hasToolbox && hovered && <NavigationToolbox />}
      {processing && <Processing />}
      {hasHoverPopover && <Popover uiName={uiName} />}
    </Container>
  )
}

export default ChartContentWrapper
