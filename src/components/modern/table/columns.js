import React from "react"
import styled from "styled-components"
import { Flex, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Name from "@/components/line/dimensions/name"
import {
  useChart,
  useAttributeValue,
  useVisibleDimensionId,
  useLatestDisplayValue,
  useUnitSign,
  useValueWithUnit,
} from "@/components/provider"
import Tooltip from "@/components/tooltip"
import Label from "@/components/filterToolbox/label"
import { labelColumn, valueColumn, findDimensionId } from "@/components/table/columns"
import { getValue } from "@/helpers/crud"
import { getAlias } from "@/helpers/units"
import { numeralsFont, tabularNumbers } from "@/components/modern/tokens"
import { StatusDot, getRowStatus } from "./status"
import Meter from "./meter"
import Trend, { useTrend } from "./trend"
import { formatReadout } from "@/components/modern/format"

const metricsByValue = {
  dimension: "dimensions",
  node: "nodes",
  instance: "instances",
  label: "labels",
  value: "values",
  default: "values",
}

const emptyArray = []

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

const RowStatus = ({ ids }) => {
  const chart = useChart()
  useAttributeValue("nodes")
  useAttributeValue("instances")

  return <StatusDot status={getRowStatus(chart, ids)} />
}

export const modernLabelColumn = (chart, options = {}) => {
  const { fallbackExpandKey, partIndex, withStatus = false } = options
  const base = labelColumn(chart, options)

  return {
    ...base,
    header: makeHeader(base.name),
    cell: ({
      row: {
        original: { ids },
        depth = 0,
        getCanExpand,
        getToggleExpandedHandler,
        getIsExpanded,
      },
    }) => {
      const [, row] = useAttributeValue("hoverX") || emptyArray
      const chart = useChart()
      const visible = ids.some(chart.isDimensionVisible)
      const [firstId] = ids

      return (
        <Flex
          justifyContent="between"
          alignItems="center"
          padding={[0, 0, 0, depth * 3]}
          opacity={visible ? null : "weak"}
          width="100%"
        >
          <Flex alignItems="center" gap={2} position="relative" width="100%">
            {withStatus && <RowStatus ids={ids} />}
            <Name padding={[0.5, 0]} flex id={firstId} fallback="[empty]" partIndex={partIndex} />
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

const Numeral = styled(TextSmall)`
  font-family: ${numeralsFont};
  ${tabularNumbers}
  font-weight: 600;
`

export const isPercentUnit = unit => typeof unit === "string" && getAlias(unit) === "%"

const TooltipValue = ({ id }) => {
  const units = useUnitSign({ long: true, dimensionId: id, withoutConversion: true })
  const value = useLatestDisplayValue(id)

  return `${value} ${units}`
}

const ModernValue = ({ id }) => {
  const chart = useChart()
  const value = useLatestDisplayValue(id, { allowNull: true })
  const { convertedUnit, unitAttributes } = useValueWithUnit(value, {
    dimensionId: id,
    scaleByValue: true,
  })
  const convertedValue = formatReadout(chart, value, { dimensionId: id, unitAttributes })
  const trend = useTrend(id)
  const percent = isPercentUnit(chart.getDimensionUnit(id))
  const color = chart.selectDimensionColor(id)

  return (
    <Flex alignItems="center" gap={2} width="100%" justifyContent="end">
      {percent ? (
        <Meter value={value} color={color} />
      ) : (
        !!trend.length && <Trend trend={trend} color={color} />
      )}
      <Flex alignItems="baseline" gap={1} flex={false}>
        <Numeral data-testid="modernTable-value" whiteSpace="nowrap">
          {convertedValue}
        </Numeral>
        {!!convertedUnit && (
          <TextMicro color="textDescription" whiteSpace="nowrap">
            {convertedUnit}
          </TextMicro>
        )}
      </Flex>
    </Flex>
  )
}

export const modernValueColumn = (chart, options = {}) => {
  const { keys = [] } = options
  const keysStr = keys.length ? keys.join("|") : ""
  const base = valueColumn(chart, options)

  return {
    ...base,
    header: makeHeader(base.name),
    cell: ({
      row: {
        original: { key, ids, contextGroups },
      },
    }) => {
      const id = findDimensionId(getValue(keysStr, ids, contextGroups, "|"), key)
      const visible = useVisibleDimensionId(id)

      if (!visible) return null

      return (
        <Tooltip content={<TooltipValue id={id} />}>
          <ModernValue id={id} />
        </Tooltip>
      )
    },
  }
}
