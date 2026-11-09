import React from "react"
import styled from "styled-components"
import { Box, Flex, TextSmall } from "@netdata/netdata-ui"
import Name from "@/components/line/dimensions/name"
import {
  useChart,
  useAttributeValue,
  useVisibleDimensionId,
  useLatestDisplayValue,
  useLatestDisplayValueWithUnit,
  useUnitSign,
  usePayload,
  useVisibleDimensionIds,
} from "@/components/provider"
import Tooltip from "@/components/tooltip"
import Label from "@/components/filterToolbox/label"
import { labelColumn, valueColumn } from "@/components/table/columns"
import reducedMotion from "@/components/helpers/reducedMotion"
import { describeWindowChange, isPercentUnit } from "@/helpers/valueFocus"
import { useValueFocus } from "@/components/modern/focus"
import { SmallNumeral } from "@/components/modern/numerals"
import { radius } from "@/components/modern/tokens"
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

const valueStylesByTone = {
  bold: { color: "text", weight: 700, size: "12px" },
  dim: { color: "textLite", weight: 400, size: "12px" },
  lite: { color: "textLite", weight: 400, size: "11px" },
  hot: { color: "warning", weight: 600, size: "12px" },
}

const Numeral = styled(SmallNumeral).attrs(({ tone }) => ({
  color: valueStylesByTone[tone].color,
  fontSize: valueStylesByTone[tone].size,
}))`
  position: relative;
  font-weight: ${({ tone }) => valueStylesByTone[tone].weight};
`

const ValueUnit = styled(TextSmall)`
  position: relative;
`

const Bar = styled(Box).attrs(({ isHot }) => ({
  as: "span",
  position: "absolute",
  height: "2px",
  round: "1px",
  opacity: 0.6,
  background: isHot ? "warning" : undefined,
}))`
  right: 0;
  bottom: -4px;
  pointer-events: none;
  transition: width 200ms ease;
  ${reducedMotion("transition: none;")}
`

export const DeltaPill = ({ children, ...rest }) => (
  <Box
    as="span"
    padding={[0.25, 1.5]}
    round={radius.pill}
    background="controlPressedBackground"
    {...rest}
  >
    <SmallNumeral color="text" fontSize="11px" lineHeight="14px" strong whiteSpace="nowrap">
      {children}
    </SmallNumeral>
  </Box>
)

const toneOf = ({ focus, hot, zero }) => {
  if (hot) return "hot"
  if (focus !== "totals") return "lite"
  return zero ? "dim" : "bold"
}

export { isPercentUnit }

const TooltipValue = ({ id, detail }) => {
  const units = useUnitSign({ long: true, dimensionId: id, withoutConversion: true })
  const value = useLatestDisplayValue(id)

  return (
    <>
      <span>{`${value} ${units}`}</span>
      {!!detail && (
        <>
          <br />
          <span>{detail}</span>
        </>
      )}
    </>
  )
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

const useHoveredRow = () => {
  const chart = useChart()
  const hoverX = useAttributeValue("hoverX")
  if (!hoverX) return undefined

  const index = chart.getClosestRow(hoverX[0])
  return index === -1 ? undefined : index
}

const ModernValue = ({ id, table, context, dimension }) => {
  const chart = useChart()
  const focus = useValueFocus("table")
  const { value, convertedUnit, unitAttributes } = useLatestDisplayValueWithUnit(id)
  const scale = useContextScale(table, context)
  const convertedValue = formatReadout(chart, value, { dimensionId: id, unitAttributes })
  const { series, trend, moved } = useTrend(id)
  const index = useHoveredRow()
  const percent = isPercentUnit(chart.getDimensionUnit(id))
  const hot = percent && isHotPercent(value)
  const share = getShare(value, scale.columns[dimension])
  const color = chart.selectDimensionColor(id)

  const change =
    focus === "totals"
      ? null
      : describeWindowChange(chart, series, {
          dimensionId: id,
          unitAttributes,
          unit: convertedUnit,
          index,
        })
  const zero = focus === "totals" && value === 0
  const showsTrend = focus === "trends" && moved && !percent && trend.length > 0
  const showsPill = focus === "changes" && !!change?.moved

  return (
    <Tooltip
      content={<TooltipValue id={id} detail={showsTrend || showsPill ? change.detail : null} />}
    >
      <Flex
        position="relative"
        alignItems="center"
        gap={1}
        width={{ base: "100%", min: "0px" }}
        justifyContent="end"
        height={{ min: 4.5 }}
      >
        {focus !== "totals" && (
          <Bar
            isHot={hot}
            style={{ width: `${share * 100}%`, ...(!hot && { background: color }) }}
            data-testid="modernTable-bar"
            data-share={share}
            data-hot={hot || undefined}
          />
        )}
        {showsTrend && <Trend trend={trend} color={color} />}
        <Numeral
          data-testid="modernTable-value"
          data-hot={hot || undefined}
          data-zero={zero || undefined}
          tone={toneOf({ focus, hot, zero })}
          whiteSpace="nowrap"
        >
          {convertedValue}
        </Numeral>
        {!!convertedUnit && (
          <ValueUnit color="textLite" whiteSpace="nowrap" data-testid="modernTable-unit">
            {convertedUnit}
          </ValueUnit>
        )}
        {showsPill && <DeltaPill data-testid="modernTable-delta">{change.delta}</DeltaPill>}
      </Flex>
    </Tooltip>
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

      return <ModernValue id={id} table={table} context={context} dimension={dimension} />
    },
  }
}
