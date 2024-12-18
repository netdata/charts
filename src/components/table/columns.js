import React from "react"
import { Flex, TextSmall } from "@netdata/netdata-ui"
import Color from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Units from "@/components/line/dimensions/units"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import {
  getValueByPeriod,
  useChart,
  useAttributeValue,
  useVisibleDimensionId,
  useLatestValue,
  useUnitSign,
} from "@/components/provider"
import Tooltip from "@/components/tooltip"
import Label from "@/components/filterToolbox/label"

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
      chart.getDimensionName((rowB.original.ids?.[0], partIndex) || "-"),
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

const ValueOnDot = ({ children, fractionDigits = 0, ref, ...rest }) => {
  const [first, last] = children.toString().split(".")
  fractionDigits = fractionDigits === -1 ? 4 : fractionDigits

  return (
    <Flex alignItems="center" justifyContent="start" ref={ref}>
      <ValuePart {...rest} flex={false} basis={3 * 1.6} textAlign="right">
        {first}
      </ValuePart>
      {typeof last !== "undefined" && <ValuePart {...rest}>.</ValuePart>}
      <ValuePart as={Flex} flex={false} width={fractionDigits * 1.6} {...rest} textAlign="left">
        {last}
      </ValuePart>
    </Flex>
  )
}

const TooltipValue = ({ id }) => {
  const units = useUnitSign({ long: true, dimensionId: id, withoutConversion: true })
  const value = useLatestValue(id)

  return `${value} ${units}`
}

export const valueColumn = (
  chart,
  { contextLabel, context = "Dimensions", dimension = "Value", dimensionId }
) => ({
  id: `value${context}${dimension}`,
  name: `${contextLabel || context} > ${dimension}`,
  header: () => {
    return (
      <Flex column>
        <TextSmall>{dimension}</TextSmall>
        <Units visible dimensionId={dimensionId} />
      </Flex>
    )
  },
  sortingFn: (rowA, rowB) => {
    return compareBasic(
      getValueByPeriod.latest({
        chart,
        id: (rowA.original.contextGroups?.[context]?.[dimension] || rowA.original.ids).find(id =>
          id.includes(rowA.original.key)
        ),
      }),
      getValueByPeriod.latest({
        chart,
        id: (rowB.original.contextGroups?.[context]?.[dimension] || rowB.original.ids).find(id =>
          id.includes(rowB.original.key)
        ),
      })
    )
  },
  fullWidth: true,
  size: 50,
  minSize: 30,
  meta: {
    tooltip: (
      <TextSmall>
        {dimension} in{" "}
        <TextSmall strong>{chart.getUnitSign({ key: "units", dimensionId, long: true })}</TextSmall>
      </TextSmall>
    ),
  },
  cell: ({
    row: {
      original: { key, ids, contextGroups },
    },
  }) => {
    const id = (contextGroups?.[context]?.[dimension] || ids).find(id => id.includes(key))
    const visible = useVisibleDimensionId(id)

    const chart = useChart()
    const fractionDigits = chart.getAttribute("unitsConversionFractionDigits")

    return (
      <Tooltip content={visible ? <TooltipValue id={id} /> : null}>
        <Value
          period="latest"
          id={id}
          visible={visible}
          Component={ValueOnDot}
          fractionDigits={fractionDigits}
          color="text"
        />
      </Tooltip>
    )
  },
})
