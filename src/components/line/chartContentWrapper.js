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
  uplot: css`
    .uplot,
    .uplot *,
    .uplot *::before,
    .uplot *::after {
      box-sizing: border-box;
    }

    .uplot {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial,
        "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
        "Noto Color Emoji";
      line-height: 1.5;
      width: min-content;
    }

    .u-title {
      text-align: center;
      font-size: 18px;
      font-weight: bold;
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

    .u-legend {
      font-size: 14px;
      margin: auto;
      text-align: center;
    }

    .u-inline {
      display: block;
    }

    .u-inline * {
      display: inline-block;
    }

    .u-inline tr {
      margin-right: 16px;
    }

    .u-legend th {
      font-weight: 600;
    }

    .u-legend th > * {
      vertical-align: middle;
      display: inline-block;
    }

    .u-legend .u-marker {
      width: 1em;
      height: 1em;
      margin-right: 4px;
      background-clip: padding-box !important;
    }

    .u-inline.u-live th::after {
      content: ":";
      vertical-align: middle;
    }

    .u-inline:not(.u-live) .u-value {
      display: none;
    }

    .u-series > * {
      padding: 4px;
    }

    .u-series th {
      cursor: pointer;
    }

    .u-legend .u-off > * {
      opacity: 0.3;
    }

    .u-select {
      background: rgba(0, 0, 0, 0.07);
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
      z-index: 100;
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
      z-index: 100;
      /* this has to be !important since we set inline "background" shorthand */
      background-clip: padding-box !important;
    }

    .u-axis.u-off,
    .u-select.u-off,
    .u-cursor-x.u-off,
    .u-cursor-y.u-off,
    .u-cursor-pt.u-off {
      display: none;
    }
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
      padding={[0, 0, 2]}
      flex
      data-testid="chartContentWrapper"
      height="100%"
      overflow="hidden"
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
      {!initialLoading && <ChartContainer />}
      {!initialLoading && <Overlays />}
      {initialLoading && <Skeleton />}
      {hovered && !empty && <Toolbox />}
      <Popover />
    </Container>
  )
}

export default ChartContentWrapper
