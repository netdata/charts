import React, { useMemo } from "react"
import styled from "styled-components"
import { Box, Flex, TextMicro, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useUnitSign } from "@/components/provider"
import { numeralsFont } from "@/components/modern/tokens"
import StatusIndicator, { getClearDescription, summarizeAlerts } from "@/components/modern/status"
import { getAttention } from "./getAttention"

const toneColor = { critical: "error", warning: "warning" }

const Value = styled(Box).attrs({ as: "span" })`
  font-family: ${numeralsFont};
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  color: ${({ tone, theme }) => getColor(tone)({ theme })};
`

const Units = styled(Box).attrs({ as: "span" })`
  font-family: ${numeralsFont};
  font-size: 13px;
  color: ${getColor("textLite")};
`

const formatValue = value =>
  typeof value === "number"
    ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : String(value)

const hoursMinutes = text => text.replace(/(\d{1,2}[:.]\d{2})[:.]\d{2}/, "$1")

const useDetail = ({ names, when }) => {
  const chart = useChart()
  useAttributeValue("timezone")

  const [first, ...rest] = names
  const since = when ? ` since ${hoursMinutes(chart.formatTime(new Date(when * 1000)))}` : ""

  if (!first) return `Alert triggered${since}`

  const more = rest.length ? ` and ${rest.length} more` : ""
  return `${first}${more} raised${since}`
}

const Raised = ({ status, count, value, names, when }) => {
  const units = useUnitSign({ withoutConversion: true })
  const tone = toneColor[status]
  const detail = useDetail({ names, when })

  return (
    <Flex column alignItems="end" gap={0.5} data-testid="chartAttention" data-status={status}>
      <Flex alignItems="center" gap={2}>
        <StatusIndicator
          status={status}
          count={count}
          names={names}
          data-testid="chartAttention-status"
        />
        {value !== null && value !== undefined && (
          <Flex alignItems="baseline" gap={1}>
            <Value tone={tone} data-testid="chartAttention-value">
              {formatValue(value)}
            </Value>
            {!!units && <Units>{units}</Units>}
          </Flex>
        )}
      </Flex>
      <TextMicro color="textLite" whiteSpace="nowrap" title={names.join(", ")}>
        {detail}
      </TextMicro>
    </Flex>
  )
}

const Attention = () => {
  const overlays = useAttributeValue("overlays")
  const alerts = useAttributeValue("alerts")

  const attention = useMemo(() => getAttention({ overlays, alerts }), [overlays, alerts])

  if (!attention) return null

  const summary = summarizeAlerts(alerts)

  if (attention.status === "clear")
    return (
      <Flex alignItems="center" height="24px" data-testid="chartAttention" data-status="clear">
        <StatusIndicator
          status="clear"
          description={getClearDescription(summary.watching)}
          data-testid="chartAttention-status"
        />
      </Flex>
    )

  const count = summary[attention.status].count || null

  return <Raised {...attention} count={count} />
}

export default Attention
