import React from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextSmall, getSizeBy } from "@netdata/netdata-ui"
import Color from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import {
  getValueByPeriod,
  useChart,
  useAttributeValue,
  useVisibleDimensionId,
  useLatestDisplayValue,
  useUnitSign,
  useValueWithUnit,
} from "@/components/provider"
import Tooltip from "@/components/tooltip"
import sanitizeId from "@/helpers/sanitizeId"
import Label from "@/components/filterToolbox/label"
import { getValue } from "@/helpers/crud"

const metricsByValue = {
  dimension: "dimensions",
  node: "nodes",
  instance: "instances",
  label: "labels",
  value: "values",
  default: "values",
}

const emptyArray = []

export const labelColumn = (chart, { fallbackExpandKey, partIndex, header = "Name" } = {}) => ({
  id: `label${header || ""}${partIndex || ""}`,
  name: header,
  header: () => <TextSmall strong>{header}</TextSmall>,
  sortingFn: (rowA, rowB) => {
    return (chart.getDimensionName(rowA.original.ids?.[0], partIndex) || "-").localeCompare(
      chart.getDimensionName(rowB.original.ids?.[0], partIndex) || "-",
      undefined,
      {
        sensitivity: "accent",
        ignorePunctuation: true,
      }
    )
  },
  fullWidth: true,
  size: 50,
  minSize: 30,
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
      >
        <Flex alignItems="center" gap={1} position="relative" width="100%">
          {visible && <Color id={firstId} partIndex={partIndex} height="18px" />}
          <Name padding={[0.5, 1.5]} flex id={firstId} fallback="[empty]" partIndex={partIndex} />
        </Flex>
        {getCanExpand() && (
          <Label
            label={
              metricsByValue[row.original.value] ||
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
})

const compareBasic = (a, b) => (a === b ? 0 : a > b ? 1 : -1)

export const findDimensionId = (value, key) => {
  const ids = Array.isArray(value) ? value : value == null ? [] : [value]

  return ids.find(id => typeof id === "string" && id.includes(key))
}

const getRowDimensionId = (keysStr, { key, ids, contextGroups }) =>
  findDimensionId(getValue(keysStr, ids, contextGroups, "|"), key)

const ValueCell = styled(Flex).attrs({
  alignItems: "center",
  width: "100%",
})`
  display: grid;
  grid-template-columns: minmax(0, 1fr) ${getSizeBy(5.5)};
`

const DisplayValue = ({ id, visible }) => {
  const value = useLatestDisplayValue(id, { allowNull: true })
  const { convertedValue, convertedUnit } = useValueWithUnit(value, {
    dimensionId: id,
    scaleByValue: true,
  })

  if (!visible) return null

  return (
    <ValueCell>
      <TextSmall color="text" textAlign="right" whiteSpace="nowrap">
        {convertedValue}
      </TextSmall>
      <Flex alignItems="center" overflow="hidden" padding={[0, 0, 0, 2]} width={{ min: "0px" }}>
        {!!convertedUnit && (
          <TextMicro color="textDescription" whiteSpace="nowrap" truncate>
            {convertedUnit}
          </TextMicro>
        )}
      </Flex>
    </ValueCell>
  )
}

const TooltipValue = ({ id }) => {
  const units = useUnitSign({ long: true, dimensionId: id, withoutConversion: true })
  const value = useLatestDisplayValue(id)

  return `${value} ${units}`
}

export const valueColumn = (chart, { dimensionLabel = "Value", dimensionId, keys = [] }) => {
  const keysStr = keys.length ? keys.join("|") : ""

  return {
    id: sanitizeId(`value${keysStr}`),
    name: dimensionLabel,
    header: () => <TextSmall>{dimensionLabel}</TextSmall>,
    sortingFn: (rowA, rowB) => {
      return compareBasic(
        getValueByPeriod.latest({
          chart,
          id: getRowDimensionId(keysStr, rowA.original),
        }),
        getValueByPeriod.latest({
          chart,
          id: getRowDimensionId(keysStr, rowB.original),
        })
      )
    },
    fullWidth: true,
    size: 50,
    minSize: 30,
    meta: {
      tooltip: (
        <TextSmall>
          {dimensionLabel} in{" "}
          <TextSmall strong>
            {chart.getUnitSign({ key: "units", dimensionId, long: true })}
          </TextSmall>
        </TextSmall>
      ),
    },
    cell: ({
      row: {
        original: { key, ids, contextGroups },
      },
    }) => {
      const id = getRowDimensionId(keysStr, { key, ids, contextGroups })
      const visible = useVisibleDimensionId(id)

      return (
        <Tooltip content={visible ? <TooltipValue id={id} /> : null}>
          <DisplayValue id={id} visible={visible} />
        </Tooltip>
      )
    },
  }
}
