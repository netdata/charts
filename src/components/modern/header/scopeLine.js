import React, { useMemo } from "react"
import styled from "styled-components"
import { TextSmall, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useEmpty, useInitialLoading } from "@/components/provider"
import { getScopeParts } from "./scopeSummary"

const ScopeButton = styled.button`
  display: block;
  max-width: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  text-align: left;
  font-family: inherit;
  font-size: 12px;
  line-height: 16px;
  cursor: ${({ disabled }) => (disabled ? "default" : "pointer")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${getColor("textLite")};

  &:hover:not(:disabled) {
    color: ${getColor("text")};
  }
`

const useScopeText = () => {
  const chart = useChart()
  const groupBy = useAttributeValue("groupBy")
  const groupByLabel = useAttributeValue("groupByLabel")
  const aggregationMethod = useAttributeValue("aggregationMethod")
  const nodesTotals = useAttributeValue("nodesTotals")
  const instancesTotals = useAttributeValue("instancesTotals")
  const dimensionsTotals = useAttributeValue("dimensionsTotals")
  const labelsTotals = useAttributeValue("labelsTotals")
  const groupingMethod = useAttributeValue("groupingMethod")
  const viewUpdateEvery = useAttributeValue("viewUpdateEvery")

  return useMemo(
    () =>
      getScopeParts(
        {
          groupBy,
          groupByLabel,
          aggregationMethod,
          nodesTotals,
          instancesTotals,
          dimensionsTotals,
          labelsTotals,
          groupingMethod,
          viewUpdateEvery,
        },
        chart.intl
      ).join(" · "),
    [
      chart,
      groupBy,
      groupByLabel,
      aggregationMethod,
      nodesTotals,
      instancesTotals,
      dimensionsTotals,
      labelsTotals,
      groupingMethod,
      viewUpdateEvery,
    ]
  )
}

const Status = ({ status, color, children }) => (
  <TextSmall color={color} data-testid={`chartScope-${status}`} truncate>
    {children}
  </TextSmall>
)

const ScopeLine = ({ hasFilters = true, open = false, onToggle }) => {
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  // useChartError reads the attribute inside the failFetch event, before failFetch stores it
  const error = useAttributeValue("error")
  const text = useScopeText()

  if (error)
    return (
      <Status status="error" color="error">
        {`Error: ${error}`}
      </Status>
    )

  if (initialLoading)
    return (
      <Status status="loading" color="textLite">
        Loading…
      </Status>
    )

  if (empty)
    return (
      <Status status="empty" color="textLite">
        No data
      </Status>
    )

  if (!text) return null

  return (
    <ScopeButton
      type="button"
      onClick={onToggle}
      disabled={!hasFilters}
      title={hasFilters ? `${text} (click to ${open ? "hide" : "edit"} filters)` : text}
      aria-expanded={hasFilters ? open : undefined}
      data-testid="chartScope"
    >
      {text}
    </ScopeButton>
  )
}

export default ScopeLine
