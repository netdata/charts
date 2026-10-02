import React from "react"
import styled, { css } from "styled-components"
import { Box, Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import makeLog from "@/sdk/makeLog"
import { radius } from "@/components/modern/tokens"
import { getZoomLabel } from "./zoomLabel"

const Chip = styled(Flex).attrs({
  alignItems: "center",
  gap: 2,
  padding: [1, 1, 1, 3],
  background: "dropdown",
})`
  position: absolute;
  top: 4px;
  right: 8px;
  z-index: 3;
  border-radius: ${radius.pill};
  box-shadow: 0 2px 8px ${getColor("dropdownShadow")};
  opacity: 0;
  pointer-events: none;
  transition: opacity 120ms ease-in-out;

  *:hover > &,
  &:focus-within {
    opacity: 1;
    pointer-events: auto;
  }

  @media (hover: none) {
    opacity: 1;
    pointer-events: auto;
  }

  ${({ isInline, isVisible }) =>
    isInline &&
    css`
      position: static;
      padding: 0;
      background: transparent;
      box-shadow: none;
      opacity: ${isVisible ? 1 : 0};
      pointer-events: ${isVisible ? "auto" : "none"};
    `}
`

const ResetButton = styled(Box).attrs({ as: "button", cursor: "pointer", background: "text" })`
  border: 0;
  border-radius: ${radius.pill};
  padding: 3px 10px;
  font-size: 12px;
  font-family: inherit;
  color: ${getColor("mainChartBg")};

  ${({ isInline }) =>
    isInline &&
    css`
      padding: 0;
      color: ${getColor("textLite")};
      background: transparent;
      text-decoration: underline;
      text-underline-offset: 2px;

      &:hover,
      &:focus-visible {
        color: ${getColor("text")};
      }
    `}
`

const ZoomChip = ({ inline = false }) => {
  const chart = useChart()
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  useAttributeValue("timezone")
  const enabledResetRange = useAttributeValue("enabledResetRange")
  const sparkline = useAttributeValue("sparkline")
  const focused = useAttributeValue("focused")

  if (!enabledResetRange || sparkline) return null

  const label = getZoomLabel({ after, before, formatTime: chart.formatTime })
  if (!label) return null

  const onReset = () => {
    chart.resetNavigation()
    makeLog(chart)({ chartAction: "chart-toolbox-reset-zoom" })
  }

  return (
    <Chip
      data-noprint
      data-testid="chartZoomChip"
      data-toolbox={chart.getId()}
      isInline={inline}
      isVisible={!!focused}
      gap={inline ? 1.5 : 2}
    >
      <TextSmall color={inline ? "textLite" : "text"} whiteSpace="nowrap">
        {label}
      </TextSmall>
      <ResetButton
        type="button"
        isInline={inline}
        onClick={onReset}
        title="Reset zoom (Alt+Shift+R)"
        data-testid="chartZoomChip-reset"
        data-track={chart.track("zoomReset")}
      >
        Reset
      </ResetButton>
    </Chip>
  )
}

export default ZoomChip
