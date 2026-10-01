import React, { useMemo } from "react"
import styled from "styled-components"
import { getColor } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import { radius } from "@/components/modern/tokens"
import { getAttention } from "@/components/modern/header/getAttention"
import { getAlertLabel, getAlertState } from "@/components/modern/number/attention"

const toneByStatus = { warning: "warning", critical: "error" }

export const getTileAlert = ({ overlays, alerts } = {}) => {
  const attention = getAttention({ overlays, alerts })
  if (!attention || attention.status === "clear") return null

  const state = getAlertState(alerts)
  const count = state && state.level === attention.status ? state.count : 1
  const label = getAlertLabel({ level: attention.status, count })
  const names = attention.names || []

  return {
    status: attention.status,
    tone: toneByStatus[attention.status],
    label,
    description: names.length ? `${label}: ${names.join(", ")}` : label,
  }
}

export const useTileAlert = () => {
  const overlays = useAttributeValue("overlays")
  const alerts = useAttributeValue("alerts")

  return useMemo(() => getTileAlert({ overlays, alerts }), [overlays, alerts])
}

const Container = styled.span`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 5px;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  font-weight: ${({ $status }) => ($status === "critical" ? 600 : 400)};
  color: ${({ $tone, theme }) => getColor($tone)({ theme })};
`

const Dot = styled.span`
  width: ${({ $status }) => ($status === "critical" ? 8 : 7)}px;
  height: ${({ $status }) => ($status === "critical" ? 8 : 7)}px;
  border-radius: ${radius.pill};
  background: ${({ $tone, theme }) => getColor($tone)({ theme })};
`

const AlertDot = ({ alert, ...rest }) => (
  <Container
    $tone={alert.tone}
    $status={alert.status}
    title={alert.description}
    data-testid="modernTileAlert"
    data-status={alert.status}
    {...rest}
  >
    <Dot $tone={alert.tone} $status={alert.status} />
    <span>{alert.label}</span>
  </Container>
)

export default AlertDot
