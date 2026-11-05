import React, { useEffect } from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextSmall } from "@netdata/netdata-ui"
import anomalyBadgeIcon from "@netdata/netdata-ui/dist/components/icon/assets/anomaly_badge.svg"
import Icon from "@/components/icon"
import Tooltip from "@/components/tooltip"
import { useAttributeValue, useChart, usePayload, usePlotArea } from "@/components/provider"
import { numeralsFont } from "@/components/modern/tokens"
import {
  formatAnomalyRate,
  getAnomalyBadgeSummary,
  getAnomalyColor,
} from "@/components/modern/anomaly"

const wideWidth = 480

const Badge = styled(Flex).attrs(({ onClick }) => ({
  as: "button",
  type: "button",
  alignItems: "center",
  gap: 1,
  round: 3,
  cursor: onClick ? "pointer" : "default",
}))`
  border: 1px solid ${({ ink, isActive }) => (isActive ? ink : "transparent")};
  ${({ isActive }) => !isActive && "background: none;"}
  font-family: ${numeralsFont};
  font-weight: 600;
  color: ${({ ink }) => ink};
`

const formatDuration = seconds => {
  const minutes = Math.round(seconds / 60)
  if (minutes < 1) return "under a minute"
  if (minutes < 120) return `about ${minutes} min`
  return `about ${Math.round(minutes / 60)} h`
}

const getStepSeconds = all =>
  all.length > 1 ? Math.max(0, (all[all.length - 1][0] - all[0][0]) / (all.length - 1) / 1000) : 0

const Summary = ({ chart, summary, canCorrelate }) => {
  const { all } = chart.getPayload()
  const { periods, peak, peakRow, anomalousRows } = summary
  const peakAt = all[peakRow]?.[0]

  return (
    <Flex column gap={1}>
      <TextSmall strong>
        {`Anomalous ${periods} ${periods === 1 ? "time" : "times"} in this window`}
      </TextSmall>
      <TextSmall>
        {`Peak ${formatAnomalyRate(peak)}%${peakAt ? ` at ${chart.formatTime(peakAt)}` : ""}, ${formatDuration(
          anomalousRows * getStepSeconds(all)
        )} in total`}
      </TextSmall>
      {canCorrelate && <TextSmall>Click to find what else changed in this window</TextSmall>}
    </Flex>
  )
}

const openCorrelate = chart => {
  chart.updateAttribute("drawer.action", "correlate")
  chart.updateAttribute("drawer.tab", "window")
  chart.updateAttribute("expanded", true)
}

const AnomalyBadge = ({ uiName = "default" }) => {
  const chart = useChart()
  usePayload()
  usePlotArea(uiName)
  useAttributeValue("selectedLegendDimensions")
  useAttributeValue("theme")
  const showAnomalies = useAttributeValue("showAnomalies")
  const spotlight = useAttributeValue("anomalySpotlight")
  const expandable = useAttributeValue("expandable")

  useEffect(() => () => chart.updateAttribute("anomalySpotlight", false), [chart])

  if (!showAnomalies) return null

  const summary = getAnomalyBadgeSummary(chart)
  if (!summary) return null

  const area = chart.getUI(uiName)?.getPlotArea?.()
  if (!area?.width) return null

  const ink = getAnomalyColor(chart, summary.peak)
  const wide = area.width >= wideWidth
  const setSpotlight = value => chart.updateAttribute("anomalySpotlight", value)

  return (
    <Flex
      position="absolute"
      zIndex={2}
      style={{ left: Math.max(0, area.left - 30), top: 0 }}
      onMouseEnter={() => setSpotlight(true)}
      onMouseLeave={() => setSpotlight(false)}
      onFocus={() => setSpotlight(true)}
      onBlur={() => setSpotlight(false)}
      data-testid="modernAnomalyBadge-anchor"
    >
      <Tooltip
        content={<Summary chart={chart} summary={summary} canCorrelate={expandable} />}
        align="bottom"
      >
        <Badge
          ink={ink}
          isActive={spotlight}
          padding={wide ? [0.25, 1, 0.25, 0.5] : [0.25]}
          background={spotlight ? "elementBackground" : undefined}
          onClick={expandable ? () => openCorrelate(chart) : undefined}
          aria-label={
            expandable
              ? "Anomalies in this window, find what else changed"
              : "Anomalies in this window"
          }
          data-testid="modernAnomalyBadge"
          data-track={chart.track("anomalyBadge")}
        >
          <Icon svg={anomalyBadgeIcon} size="10px" color={ink} />
          {wide && (
            <TextMicro color={ink} strong lineHeight="10px">
              {`${formatAnomalyRate(summary.peak)}%`}
            </TextMicro>
          )}
        </Badge>
      </Tooltip>
    </Flex>
  )
}

export default AnomalyBadge
