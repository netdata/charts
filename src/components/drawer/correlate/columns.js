import React from "react"
import { Flex, Icon, TextMicro, TextSmall } from "@netdata/netdata-ui"
import Sparkline from "./sparkline"
import { ValueUnitGrid, ValueUnitHeader } from "@/components/drawer/valueWithUnit"

const valueColumnSize = 144
const valueColumnMinSize = 120

const getWeightColor = weight => {
  const absWeight = Math.abs(weight)
  if (absWeight >= 0.8) return "primary"
  if (absWeight >= 0.5) return "warning"
  if (absWeight >= 0.2) return "textLite"
  return "textDescription"
}

export const formatWeight = weight => ((1 - weight) * 100).toFixed(1)

export const formatChange = change => `${change > 0 ? "+" : ""}${change.toFixed(1)}`

export const nameColumn = () => ({
  id: "name",
  header: <TextSmall strong>Metric</TextSmall>,
  headerString: () => "Metric",
  accessorFn: row =>
    row.kind === "context"
      ? row.contextName
      : [row.dimensionName, row.nodeName, row.context].filter(Boolean).join(" "),
  enableGlobalFilter: true,
  size: 480,
  minSize: 180,
  maxSize: 900,
  cell: ({ row }) => {
    const item = row.original

    if (item.kind === "context") {
      return (
        <Flex alignItems="center" gap={1} width="100%">
          {row.getCanExpand() && (
            <Icon
              name={row.getIsExpanded() ? "chevron_down" : "chevron_right"}
              color="textDescription"
              size="small"
            />
          )}
          <Flex column gap={1} width={{ min: "0px" }}>
            <TextSmall strong whiteSpace="normal" wordBreak="break-word">
              {item.contextName}
            </TextSmall>
            <TextMicro color="textDescription">{item.count} correlated dimensions</TextMicro>
          </Flex>
        </Flex>
      )
    }

    return (
      <Flex
        column
        gap={1}
        padding={[0, 0, 0, (item.searchDepth ?? row.depth) * 3]}
        width={{ min: "0px", base: "100%" }}
      >
        <TextSmall
          title={`Metric: ${item.dimensionName}\nContext: ${item.context}\nNode: ${item.nodeName}`}
          whiteSpace="normal"
          wordBreak="break-word"
        >
          {item.dimensionName}
        </TextSmall>
        <TextMicro color="textDescription" whiteSpace="normal" wordBreak="break-word">
          {item.nodeName} • {item.context}
        </TextMicro>
      </Flex>
    )
  },
})

export const correlationColumn = () => ({
  id: "correlation",
  header: <ValueUnitHeader label="Correlation" />,
  headerString: () => "Correlation",
  accessorFn: row => (row.kind === "context" ? row.minWeight : row.correlationWeight),
  enableGlobalFilter: false,
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  maxSize: 160,
  fullWidth: true,
  cell: ({ row, getValue }) => {
    const item = row.original
    const weight = getValue()

    return (
      <ValueUnitGrid
        value={formatWeight(weight)}
        unit="%"
        detail={item.kind === "dimension" ? item.correlationStrength : undefined}
        color={getWeightColor(weight)}
      />
    )
  },
  sortingFn: "basic",
})

export const changeColumn = () => ({
  id: "change",
  header: <ValueUnitHeader label="Change" />,
  headerString: () => "Change",
  accessorFn: row => (row.kind === "dimension" ? row.percentChange : null),
  enableGlobalFilter: false,
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  maxSize: 140,
  fullWidth: true,
  cell: ({ row, getValue }) => {
    if (row.original.kind !== "dimension") return null

    const change = getValue()
    const color = change > 0 ? "warning" : change < 0 ? "primary" : "textLite"
    return <ValueUnitGrid value={formatChange(change)} unit="%" color={color} />
  },
  sortingFn: "basic",
})

export const sparklineColumn = () => ({
  id: "sparkline",
  header: (
    <Flex alignItems="center" gap={1} width="100%">
      <Flex
        flex={false}
        basis={`${valueColumnSize}px`}
        width={`${valueColumnSize}px`}
      >
        <ValueUnitHeader label="Value" />
      </Flex>
      <TextMicro strong>Trend</TextMicro>
    </Flex>
  ),
  headerString: () => "Trend",
  size: 300,
  minSize: 260,
  maxSize: 420,
  cell: ({ row }) => {
    if (row.original.kind !== "dimension") return null

    const dimensions =
      row.original.searchSiblings || row.getParentRow()?.original.children || [row.original]

    return (
      <Flex width="100%" height="32px">
        <Sparkline dimension={row.original} dimensions={dimensions} />
      </Flex>
    )
  },
})
