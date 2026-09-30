import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
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
`

const ResetButton = styled.button`
  border: 0;
  border-radius: ${radius.pill};
  padding: 3px 10px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  color: ${getColor("mainChartBg")};
  background: ${getColor("text")};
`

const ZoomChip = () => {
  const chart = useChart()
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  useAttributeValue("timezone")
  const enabledResetRange = useAttributeValue("enabledResetRange")

  if (!enabledResetRange) return null

  const label = getZoomLabel({ after, before, formatTime: chart.formatTime })
  if (!label) return null

  const onReset = () => {
    chart.resetNavigation()
    makeLog(chart)({ chartAction: "chart-toolbox-reset-zoom" })
  }

  return (
    <Chip data-noprint data-testid="chartZoomChip" data-toolbox={chart.getId()}>
      <TextSmall color="text" whiteSpace="nowrap">
        {label}
      </TextSmall>
      <ResetButton
        type="button"
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
