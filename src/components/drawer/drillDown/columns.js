import React, { useMemo } from "react"
import { Flex, ProgressBar, TextSmall } from "@netdata/netdata-ui"
import Color from "@/components/line/dimensions/color"
import { useChart } from "@/components/provider"
import Label from "@/components/filterToolbox/label"
import ValueWithUnit, { ValueUnitHeader } from "@/components/drawer/valueWithUnit"

const valueColumnSize = 144
const valueColumnMinSize = 120

const useMetricsByValue = chart =>
  useMemo(
    () => ({
      dimension: "dimensions",
      node: "nodes",
      instance: chart.intl("instance", { count: 2 }),
      label: "labels",
      value: "values",
      default: "values",
    }),
    []
  )

export const labelColumn = (groupByOrder = []) => ({
  id: "label",
  header: () => <TextSmall strong>Name</TextSmall>,
  headerString: () => "Name",
  accessorKey: "label",
  enableGlobalFilter: true,
  size: 200,
  minSize: 60,
  maxSize: 800,
  cell: ({ getValue, row }) => {
    const chart = useChart()
    const metricsByValue = useMetricsByValue(chart)

    const currentLevel = row.original.level || 0
    const nextLevel = currentLevel + 1
    const nextGroupByType = groupByOrder[nextLevel]

    const expandLabel = nextGroupByType
      ? metricsByValue[nextGroupByType] || metricsByValue.default
      : metricsByValue.default

    return (
      <Flex
        justifyContent="between"
        alignItems="center"
        padding={[0, 0, 0, (row.original.searchDepth ?? row.depth) * 3]}
        width="100%"
      >
        <Flex gap={1}>
          <Color id={row.original.id} />
          <TextSmall
            strong
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              row.getToggleExpandedHandler?.()?.(e)
              setTimeout(() => e.target?.scrollIntoView?.({ behavior: "smooth", block: "nearest" }))
            }}
            cursor={row.original.disabled ? "default" : "pointer"}
            whiteSpace="normal"
            wordBreak="break-word"
          >
            {getValue()}
          </TextSmall>
        </Flex>
        {row.getCanExpand?.() && (
          <Label
            label={expandLabel}
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              row.getToggleExpandedHandler?.()(e)
              setTimeout(() => e.target?.scrollIntoView?.({ behavior: "smooth", block: "nearest" }))
            }}
            iconRotate={row.getIsExpanded?.() ? 2 : null}
            textProps={{ fontSize: "10px", color: "textLite" }}
            alignItems="center"
          />
        )}
      </Flex>
    )
  },
})

export const contributionColumn = () => ({
  id: "contribution",
  header: <ValueUnitHeader label="Volume" />,
  headerString: () => "Volume",
  accessorKey: "contribution",
  enableGlobalFilter: false,
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue }) => {
    const value = getValue() || 0
    const percentage = Math.round((value + Number.EPSILON) * 100) / 100

    return (
      <Flex flex column gap={0.5}>
        <ValueWithUnit value={percentage} valueKey="percent" unit="%" color="primary" />
        <ProgressBar
          background="progressBg"
          color={["green", "deyork"]}
          height={2}
          width={`${Math.min(percentage, 100)}%`}
          containerWidth="100%"
          border="none"
        />
      </Flex>
    )
  },
  sortingFn: "basic",
})

export const anomalyRateColumn = () => ({
  id: "anomalyRate",
  header: <ValueUnitHeader label="Anomaly" />,
  headerString: () => "Anomaly",
  accessorKey: "anomalyRate",
  enableGlobalFilter: false,
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue }) => {
    const value = getValue() || 0
    const percentage = Math.round((value + Number.EPSILON) * 100) / 100

    return (
      <Flex flex column gap={0.5}>
        <ValueWithUnit value={percentage} valueKey="percent" unit="%" color="textLite" />
        <ProgressBar
          background="progressBg"
          color="anomalyText"
          height={2}
          width={`${Math.min(percentage, 100)}%`}
          containerWidth="100%"
          border="none"
        />
      </Flex>
    )
  },
  sortingFn: "basic",
})

export const minColumn = () => ({
  id: "min",
  header: <ValueUnitHeader label="Min" />,
  headerString: () => "Min",
  accessorFn: row => row.timeframe?.min,
  enableGlobalFilter: false,
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue, row }) => (
    <ValueWithUnit
      value={getValue()}
      dimensionId={row.original.groupedBy?.dimension}
      color="textLite"
    />
  ),
  sortingFn: "basic",
})

export const avgColumn = () => ({
  id: "avg",
  header: <ValueUnitHeader label="Avg" />,
  headerString: () => "Avg",
  accessorFn: row => row.timeframe?.avg,
  enableGlobalFilter: false,
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue, row }) => (
    <ValueWithUnit
      value={getValue()}
      dimensionId={row.original.groupedBy?.dimension}
      color="textLite"
    />
  ),
  sortingFn: "basic",
})

export const maxColumn = () => ({
  id: "max",
  header: <ValueUnitHeader label="Max" />,
  headerString: () => "Max",
  accessorFn: row => row.timeframe?.max,
  enableGlobalFilter: false,
  size: valueColumnSize,
  minSize: valueColumnMinSize,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue, row }) => (
    <ValueWithUnit
      value={getValue()}
      dimensionId={row.original.groupedBy?.dimension}
      color="textLite"
    />
  ),
  sortingFn: "basic",
})
