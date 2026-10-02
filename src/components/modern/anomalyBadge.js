import React, { useEffect } from "react"
import styled from "styled-components"
import { Flex, TextSmall } from "@netdata/netdata-ui"
import anomalyBadgeIcon from "@netdata/netdata-ui/dist/components/icon/assets/anomaly_badge.svg"
import Icon from "@/components/icon"
import Tooltip, { tooltipStyleProps } from "@/components/tooltip"
import { useAttributeValue, useChart, usePayload, usePlotArea } from "@/components/provider"
import { numeralsFont } from "@/components/modern/tokens"
import { formatAnomalyRate, getAnomalyColor, getAnomalySummary } from "@/components/modern/anomaly"

const wideWidth = 480

const Anchor = styled(Flex).attrs({ position: "absolute", zIndex: 2 })``

const Badge = styled(Flex).attrs({
  as: "button",
  type: "button",
  alignItems: "center",
  gap: 1,
  round: 3,
})`
  border: 1px solid ${({ ink, isActive }) => (isActive ? ink : "transparent")};
  ${({ isActive }) => !isActive && "background: none;"}
  font-family: ${numeralsFont};
  font-weight: 600;
  cursor: ${({ onClick }) => (onClick ? "pointer" : "default")};
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
    <Flex column gap={1} {...tooltipStyleProps}>
      <TextSmall color="tooltipText" strong>
        {`Anomalous ${periods} ${periods === 1 ? "time" : "times"} in this window`}
      </TextSmall>
      <TextSmall color="tooltipText">
        {`Peak ${formatAnomalyRate(peak)}%${peakAt ? ` at ${chart.formatTime(peakAt)}` : ""}, ${formatDuration(
          anomalousRows * getStepSeconds(all)
        )} in total`}
      </TextSmall>
      {canCorrelate && (
        <TextSmall color="tooltipText">Click to find what else changed in this window</TextSmall>
      )}
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

  if (!showAnomalies || chart.isSparkline()) return null
  if (chart.getAttribute("enabledYAxis") === false) return null
  if (chart.getAttribute("chartType") === "heatmap") return null

  const summary = getAnomalySummary(chart)
  if (!summary.periods) return null

  const area = chart.getUI(uiName)?.getPlotArea?.()
  if (!area?.width) return null

  const ink = getAnomalyColor(chart, summary.peak)
  const wide = area.width >= wideWidth
  const setSpotlight = value => chart.updateAttribute("anomalySpotlight", value)

  return (
    <Anchor
      style={{ left: Math.max(0, area.left - 30), top: Math.max(0, area.top - 18) }}
      onMouseEnter={() => setSpotlight(true)}
      onMouseLeave={() => setSpotlight(false)}
      onFocus={() => setSpotlight(true)}
      onBlur={() => setSpotlight(false)}
      data-testid="modernAnomalyBadge-anchor"
    >
      <Tooltip
        content={<Summary chart={chart} summary={summary} canCorrelate={expandable} />}
        Content={({ children }) => children}
        align="bottom"
      >
        <Badge
          ink={ink}
          isActive={spotlight}
          padding={wide ? [0.5, 2, 0.5, 1] : [0.5]}
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
          <Icon svg={anomalyBadgeIcon} size="14px" color={ink} />
          {wide && (
            <TextSmall color={ink} strong>{`${formatAnomalyRate(summary.peak)}%`}</TextSmall>
          )}
        </Badge>
      </Tooltip>
    </Anchor>
  )
}

export default AnomalyBadge
