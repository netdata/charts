import React, { useMemo } from "react"
import { Flex, ProgressBar, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Color from "@/components/line/dimensions/color"
import Units from "@/components/line/dimensions/units"
import { useChart, useConverted } from "@/components/provider"
import Label from "@/components/filterToolbox/label"

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
        padding={[0, 0, 0, row.depth * 3]}
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
              setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }))
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
              setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }))
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
  header: <TextMicro strong>Vol %</TextMicro>,
  headerString: () => "Vol %",
  accessorKey: "contribution",
  size: 60,
  minSize: 30,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue }) => {
    const value = getValue() || 0
    const percentage = Math.round((value + Number.EPSILON) * 100) / 100

    return (
      <Flex flex column gap={0.5}>
        <TextSmall color="primary">{percentage}%</TextSmall>
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
  header: <TextMicro strong>Anomaly%</TextMicro>,
  headerString: () => "Anomaly%",
  accessorKey: "anomalyRate",
  size: 60,
  minSize: 30,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue }) => {
    const value = getValue() || 0
    const percentage = Math.round((value + Number.EPSILON) * 100) / 100

    return (
      <Flex flex column gap={0.5}>
        <TextSmall color="textLite">{percentage}%</TextSmall>
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

export const minColumn = chart => ({
  id: "min",
  header: (
    <TextMicro strong>
      Min <Units visible />
    </TextMicro>
  ),
  headerString: () => `Min  (${chart.getUnitSign({ key: "units" })})`,
  accessorFn: row => row.timeframe?.min,
  size: 60,
  minSize: 30,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue }) => {
    const value = useConverted(getValue())
    return <TextSmall color="textLite">{value}</TextSmall>
  },
  sortingFn: "basic",
})

export const avgColumn = chart => ({
  id: "avg",
  header: (
    <TextMicro strong>
      Avg <Units visible />
    </TextMicro>
  ),
  headerString: () => `Avg  (${chart.getUnitSign({ key: "units" })})`,
  accessorFn: row => row.timeframe?.avg,
  size: 60,
  minSize: 30,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue }) => {
    const value = useConverted(getValue())
    return <TextSmall color="textLite">{value}</TextSmall>
  },
  sortingFn: "basic",
})

export const maxColumn = chart => ({
  id: "max",
  header: (
    <TextMicro strong>
      Max <Units visible />
    </TextMicro>
  ),
  headerString: () => `Max  (${chart.getUnitSign({ key: "units" })})`,
  accessorFn: row => row.timeframe?.max,
  size: 60,
  minSize: 30,
  maxSize: 300,
  fullWidth: true,
  cell: ({ getValue }) => {
    const value = useConverted(getValue())
    return <TextSmall color="textLite">{value}</TextSmall>
  },
  sortingFn: "basic",
})
