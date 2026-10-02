import React from "react"
import styled from "styled-components"
import { Box, Flex, TextSmall, getColor } from "@netdata/netdata-ui"
import Name from "@/components/line/dimensions/name"
import {
  useChart,
  useAttributeValue,
  useVisibleDimensionId,
  useVisibleDimensionIds,
  useLatestDisplayValue,
  useLatestDisplayValueWithUnit,
  useUnitSign,
  usePayload,
} from "@/components/provider"
import Tooltip from "@/components/tooltip"
import Label from "@/components/filterToolbox/label"
import { labelColumn, valueColumn } from "@/components/table/columns"
import { getAlias } from "@/helpers/units"
import { SmallNumeral } from "@/components/modern/numerals"
import { formatReadout } from "@/components/modern/format"
import { StatusDot, getRowStatus } from "./status"
import Trend, { useTrend } from "./trend"
import { getRowDimensionId, getContextScale, getShare, isHotPercent } from "./scale"

const metricsByValue = {
  dimension: "dimensions",
  node: "nodes",
  instance: "instances",
  label: "labels",
  value: "values",
  default: "values",
}

const emptyArray = []

export const missingValueText = "This device reports no value for this column"

const rowHover = '[data-testid^="netdata-table-row"]:hover &'

export const ModernHeader = ({ label, sorted }) => (
  <TextSmall
    data-testid="modernTable-header"
    data-sorted={sorted || undefined}
    color={sorted ? "text" : "textLite"}
    strong={!!sorted}
    whiteSpace="nowrap"
    truncate
  >
    {label}
  </TextSmall>
)

const makeHeader =
  label =>
  ({ column }) => <ModernHeader label={label} sorted={column?.getIsSorted?.() || false} />

const makeValueHeader =
  label =>
  ({ column }) => (
    <Flex width="100%" justifyContent="end">
      <ModernHeader label={label} sorted={column?.getIsSorted?.() || false} />
    </Flex>
  )

const SortButton = styled(Flex).attrs({
  as: "button",
  alignItems: "baseline",
  gap: 0.5,
  width: { min: "0px" },
  padding: [0],
  cursor: "pointer",
  color: "textLite",
})`
  display: inline-flex;
  border: 0;
  background: transparent;
  font-family: inherit;
`

const sortArrows = { asc: "↑", desc: "↓" }

const isHidden = (table, id) => table?.getColumn?.(id)?.getIsVisible?.() === false

const MergedHeader = ({ label, column, table, merged }) => (
  <Flex alignItems="baseline" gap={2} overflow="hidden" data-testid="modernTable-mergedHeader">
    <ModernHeader label={label} sorted={column?.getIsSorted?.() || false} />
    {merged.map(({ id, name }) => {
      if (!isHidden(table, id)) return null

      const other = table.getColumn(id)
      const sorted = other.getIsSorted() || false

      return (
        <SortButton
          key={id}
          type="button"
          title={`Sort by ${name}`}
          data-testid="modernTable-mergedSort"
          data-column={id}
          onClick={event => {
            event.stopPropagation()
            other.getToggleSortingHandler()?.(event)
          }}
        >
          <ModernHeader label={name} sorted={sorted} />
          {!!sorted && <TextSmall color="text">{sortArrows[sorted]}</TextSmall>}
        </SortButton>
      )
    })}
  </Flex>
)

const RowStatus = ({ ids }) => {
  const chart = useChart()
  useAttributeValue("nodes")
  useAttributeValue("instances")

  return <StatusDot status={getRowStatus(chart, ids)} />
}

export const getMergedLabelVisibility = (columns = emptyArray) => {
  const [first] = columns
  const merged = first?.columns?.slice(1) || emptyArray
  if (!merged.length) return undefined

  return merged.reduce((visibility, { id }) => {
    visibility[id] = false
    return visibility
  }, {})
}

export const modernLabelColumn = (chart, options = {}) => {
  const { fallbackExpandKey, partIndex, withStatus = false, mergedLabels = emptyArray } = options
  const base = labelColumn(chart, options)

  return {
    ...base,
    header: mergedLabels.length
      ? ({ column, table }) => (
          <MergedHeader label={base.name} column={column} table={table} merged={mergedLabels} />
        )
      : makeHeader(base.name),
    cell: ({
      row: {
        original: { ids },
        depth = 0,
        getCanExpand,
        getToggleExpandedHandler,
        getIsExpanded,
      },
      table,
    }) => {
      const [, row] = useAttributeValue("hoverX") || emptyArray
      const chart = useChart()
      const visible = ids.some(chart.isDimensionVisible)
      const [firstId] = ids
      const merged = mergedLabels.filter(({ id }) => isHidden(table, id))

      return (
        <Flex
          justifyContent="between"
          alignItems="center"
          padding={[0, 0, 0, depth * 3]}
          opacity={visible ? null : "weak"}
          width="100%"
        >
          <Flex column width={{ min: "0px" }} flex>
            <Flex alignItems="center" gap={2} position="relative" width="100%">
              {withStatus && <RowStatus ids={ids} />}
              <Name padding={[0.5, 0]} flex id={firstId} fallback="[empty]" partIndex={partIndex} />
            </Flex>
            {merged.map(({ id, partIndex: mergedIndex }) => (
              <Name
                key={id}
                id={firstId}
                partIndex={mergedIndex}
                fallback="[empty]"
                color="textLite"
                padding={[0, 0, 0.5, withStatus ? 4 : 0]}
                data-testid="modernTable-mergedLabel"
                data-column={id}
              />
            ))}
          </Flex>
          {getCanExpand() && (
            <Label
              label={
                metricsByValue[row?.original?.value] ||
                metricsByValue[fallbackExpandKey] ||
                metricsByValue.default
              }
              onClick={e => {
                getToggleExpandedHandler()(e)
                setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }))
              }}
              iconRotate={getIsExpanded() ? 2 : null}
              textProps={{ fontSize: "10px", color: "textLite" }}
            />
          )}
        </Flex>
      )
    },
  }
}

const Numeral = styled(SmallNumeral)`
  position: relative;
  font-weight: 600;
`

const ValueUnit = styled(TextSmall)`
  position: relative;
`

const Bar = styled(Box).attrs(({ isHot }) => ({
  as: "span",
  position: "absolute",
  round: true,
  background: isHot ? "warning" : "text",
  opacity: isHot ? 0.18 : 0.06,
}))`
  top: -3px;
  bottom: -3px;
  left: -6px;
  right: -6px;
  pointer-events: none;
  transform-origin: right;
  transition: transform 200ms ease;

  ${rowHover} {
    opacity: ${({ isHot }) => (isHot ? 0.24 : 0.1)};
  }
`

const TrendHolder = styled(Box).attrs({ as: "span", position: "relative", opacity: 0.55 })`
  display: inline-flex;
  flex: none;
  transition: opacity 120ms ease;

  path {
    stroke: ${getColor("textLite")};
  }

  ${rowHover} {
    opacity: 1;
  }

  ${rowHover} path {
    stroke: var(--modern-trend-color);
  }
`

export const isPercentUnit = unit => typeof unit === "string" && getAlias(unit) === "%"

const TooltipValue = ({ id }) => {
  const units = useUnitSign({ long: true, dimensionId: id, withoutConversion: true })
  const value = useLatestDisplayValue(id)

  return `${value} ${units}`
}

const useContextScale = (table, context) => {
  const chart = useChart()
  usePayload()
  useAttributeValue("hoverX")
  useVisibleDimensionIds()

  return getContextScale(chart, table?.options?.data, context)
}

export const ModernGroupHeader = ({ context }) => {
  const chart = useChart()

  return (
    <Flex
      alignItems="baseline"
      justifyContent="center"
      gap={1.5}
      overflow="hidden"
      data-testid="modernTable-groupHeader"
    >
      <TextSmall strong whiteSpace="nowrap" truncate>
        {chart.intl(context)}
      </TextSmall>
    </Flex>
  )
}

const ModernValue = ({ id, table, context, dimension }) => {
  const chart = useChart()
  const { value, convertedUnit, unitAttributes } = useLatestDisplayValueWithUnit(id)
  const scale = useContextScale(table, context)
  const convertedValue = formatReadout(chart, value, { dimensionId: id, unitAttributes })
  const trend = useTrend(id)
  const percent = isPercentUnit(chart.getDimensionUnit(id))
  const hot = percent && isHotPercent(value)
  const share = getShare(value, scale.columns[dimension])

  return (
    <Flex
      position="relative"
      alignItems="center"
      gap={2}
      width="100%"
      justifyContent="end"
      height={{ min: 4.5 }}
    >
      <Bar
        isHot={hot}
        style={{ transform: `scaleX(${share})` }}
        data-testid="modernTable-bar"
        data-share={share}
        data-hot={hot || undefined}
      />
      {!percent && !!trend.length && (
        <TrendHolder style={{ "--modern-trend-color": chart.selectDimensionColor(id) }}>
          <Trend trend={trend} color={chart.selectDimensionColor(id)} />
        </TrendHolder>
      )}
      <Numeral
        data-testid="modernTable-value"
        data-hot={hot || undefined}
        color={hot ? "warning" : "text"}
        whiteSpace="nowrap"
      >
        {convertedValue}
      </Numeral>
      {!!convertedUnit && (
        <ValueUnit color="textLite" whiteSpace="nowrap" data-testid="modernTable-unit">
          {convertedUnit}
        </ValueUnit>
      )}
    </Flex>
  )
}

const MissingValue = () => (
  <Flex width="100%" justifyContent="end">
    <Tooltip content={missingValueText}>
      <SmallNumeral
        color="textLite"
        cursor="default"
        aria-label={missingValueText}
        data-testid="modernTable-missing"
      >
        –
      </SmallNumeral>
    </Tooltip>
  </Flex>
)

export const modernValueColumn = (chart, options = {}) => {
  const { keys = [] } = options
  const keysStr = keys.length ? keys.join("|") : ""
  const [context, dimension] = keys
  const base = valueColumn(chart, options)

  return {
    ...base,
    header: makeValueHeader(base.name),
    cell: ({
      row: {
        original: { key, ids, contextGroups },
      },
      table,
    }) => {
      const id = getRowDimensionId(keysStr, { key, ids, contextGroups })
      const visible = useVisibleDimensionId(id)

      if (!id) return <MissingValue />

      if (!visible) return null

      return (
        <Tooltip content={<TooltipValue id={id} />}>
          <ModernValue id={id} table={table} context={context} dimension={dimension} />
        </Tooltip>
      )
    },
  }
}
