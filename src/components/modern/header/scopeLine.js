import React, { useMemo } from "react"
import styled from "styled-components"
import { Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import { useAttributeValue, useChart, useEmpty, useInitialLoading } from "@/components/provider"
import { getScopeParts } from "./scopeSummary"
import { showAllDimensions, useHiddenDimensionsCount } from "./hiddenDimensions"

const ScopeButton = styled.button`
  display: block;
  max-width: 100%;
  min-width: 0;
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
  color: ${({ $color, theme }) => getColor($color || "textLite")({ theme })};

  &:hover:not(:disabled) {
    color: ${({ $color, theme }) => getColor($color || "text")({ theme })};
  }
`

const HiddenText = styled.span`
  flex-shrink: 0;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  color: ${getColor("warning")};
`

const ShowAllButton = styled.button`
  flex-shrink: 0;
  margin-left: 4px;
  border: 0;
  padding: 0;
  background: transparent;
  font-family: inherit;
  font-size: 12px;
  line-height: 16px;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: underline;
  color: ${getColor("warning")};
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
      ).join(", "),
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

const Status = ({ status, color, hasFilters, open, onToggle, children }) => {
  if (!hasFilters)
    return (
      <TextSmall color={color} data-testid={`chartScope-${status}`} truncate>
        {children}
      </TextSmall>
    )

  // an empty or failing query is often fixed from the filters, so the state stays a way in
  return (
    <ScopeButton
      type="button"
      onClick={onToggle}
      $color={color}
      title={`${children} (click to ${open ? "hide" : "edit"} filters)`}
      aria-expanded={open}
      data-testid={`chartScope-${status}`}
    >
      {children}
    </ScopeButton>
  )
}

const Hidden = ({ count, leading }) => {
  const chart = useChart()

  return (
    <>
      <HiddenText data-testid="chartScope-hidden">
        {leading ? `, ${count} hidden,` : `${count} hidden,`}
      </HiddenText>
      <ShowAllButton
        type="button"
        onClick={() => showAllDimensions(chart)}
        data-testid="chartScope-showAll"
        data-track={chart.track("showAllDimensions")}
      >
        Show all
      </ShowAllButton>
    </>
  )
}

const ScopeLine = ({ hasFilters = true, open = false, onToggle }) => {
  const initialLoading = useInitialLoading()
  const empty = useEmpty()
  // useChartError reads the attribute inside the failFetch event, before failFetch stores it
  const error = useAttributeValue("error")
  const text = useScopeText()
  const hidden = useHiddenDimensionsCount()
  const statusProps = { hasFilters, open, onToggle }

  if (error)
    return (
      <Status status="error" color="error" {...statusProps}>
        {`Error: ${error}`}
      </Status>
    )

  if (initialLoading)
    return (
      <Status status="loading" color="textLite" {...statusProps}>
        Loading…
      </Status>
    )

  if (empty)
    return (
      <Status status="empty" color="textLite" {...statusProps}>
        No data
      </Status>
    )

  if (!text && !hidden) return null

  return (
    <Flex alignItems="baseline" width={{ min: "0px" }} overflow="hidden">
      {!!text && (
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
      )}
      {hidden > 0 && <Hidden count={hidden} leading={!!text} />}
    </Flex>
  )
}

export default ScopeLine
