import React, { useMemo } from "react"
import { Flex, ProgressBar, TextSmall, TextMicro, MasterCard } from "@netdata/netdata-ui"
import styled from "styled-components"
import Color, { ColorBar } from "@/components/line/dimensions/color"
import Name from "@/components/line/dimensions/name"
import Units from "@/components/line/dimensions/units"
import Value, { Value as ValuePart } from "@/components/line/dimensions/value"
import {
  useChart,
  useConverted,
  useAttributeValue,
  useVisibleDimensionId,
} from "@/components/provider"
import Label from "@/components/filterToolbox/label"
import { rowFlavours } from "@/components/line/popover/dimensions"

const ColorBackground = styled(ColorBar).attrs({
  position: "absolute",
  top: 1,
  left: 2,
  backgroundOpacity: 0.4,
  round: 0.5,
})``

const rowValueKeys = {
  ANOMALY_RATE: "arp",
  default: "value",
}

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

const emptyArray = []

export const labelColumn = fallbackExpandKey => ({
  id: "label",
  header: () => <TextSmall strong>Name</TextSmall>,
  size: 200,
  minSize: 60,
  maxSize: 800,
  cell: ({ getValue, row }) => {
    const chart = useChart()
    const metricsByValue = useMetricsByValue(chart)

    return (
      <Flex
        justifyContent="between"
        alignItems="center"
        padding={[0, 0, 0, row.depth * 3]}
        width="100%"
      >
        <Flex gap={1}>
          <Color id={getValue()} />
          <TextSmall
            strong
            onClick={
              !row.original.disabled
                ? e => {
                    e.preventDefault()
                    e.stopPropagation()
                    row.getToggleSelectedHandler()(e)
                  }
                : undefined
            }
            cursor={row.original.disabled ? "default" : "pointer"}
            whiteSpace="normal"
            wordBreak="break-word"
          >
            {getValue()}
          </TextSmall>
        </Flex>
        {row.getCanExpand() && (
          <Label
            label={
              metricsByValue[getValue()] ||
              metricsByValue[fallbackExpandKey] ||
              metricsByValue.default
            }
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              row.getToggleExpandedHandler()(e)
              setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }))
            }}
            iconRotate={row.getIsExpanded() ? 2 : null}
            textProps={{ fontSize: "10px", color: "textLite" }}
            alignItems="center"
          />
        )}
      </Flex>
    )
  },
})

export const metricsColumn = () => ({
  id: "metrics",
  header: <TextMicro strong>Metrics</TextMicro>,
  size: 60,
  minSize: 30,
  maxSize: 300,
  fullWidth: true,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.ds) return <TextSmall color="textLite">{getValue()}</TextSmall>

    const { qr = 0, sl = 0, ex = 0 } = row.original.info.ds
    return (
      <Flex flex column gap={0.5}>
        <TextSmall color="textLite">
          <TextSmall color="primary">{qr}</TextSmall> of {sl + ex}
        </TextSmall>
        <ProgressBar
          background="progressBg"
          color={["green", "deyork"]}
          height={2}
          width={`${(qr / (sl + ex)) * 100}%`}
          containerWidth="100%"
          border="none"
        />
      </Flex>
    )
  },
  sortingFn: "basic",
})

export const contributionColumn = () => ({
  id: "contribution",
  header: <TextMicro strong>Vol %</TextMicro>,
  size: 60,
  minSize: 30,
  maxSize: 300,
  fullWidth: true,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.sts) return <TextSmall color="textLite">{getValue()}</TextSmall>

    return (
      <Flex flex column gap={0.5}>
        <TextSmall color="primary">
          {Math.round((getValue() + Number.EPSILON) * 100) / 100}%
        </TextSmall>
        <ProgressBar
          background="progressBg"
          color={["green", "deyork"]}
          height={2}
          width={`${getValue()}%`}
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
  size: 60,
  minSize: 30,
  maxSize: 300,
  fullWidth: true,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.sts) return <TextSmall color="textLite">{getValue()}</TextSmall>

    return (
      <Flex flex column gap={0.5}>
        <TextSmall color="textLite">
          {Math.round((getValue() + Number.EPSILON) * 100) / 100}%
        </TextSmall>
        <ProgressBar
          background="progressBg"
          color="anomalyText"
          height={2}
          width={`${getValue()}%`}
          containerWidth="100%"
          border="none"
        />
      </Flex>
    )
  },
  sortingFn: "basic",
})

const ValueOnDot = ({ children, fractionDigits = 0, ...rest }) => {
  const [first, last] = children.toString().split(".")

  return (
    <Flex alignItems="center" justifyContent="start">
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

export const valueColumn = () => ({
  id: "value",
  header: (
    <TextMicro>
      Value <Units visible />
    </TextMicro>
  ),
  size: 45,
  minSize: 45,
  cell: ({
    row: { original: id, depth = 0, getCanExpand, getToggleExpandedHandler, getIsExpanded },
  }) => {
    const visible = useVisibleDimensionId(id)

    const chart = useChart()
    const fractionDigits = chart.getAttribute("unitsConversionFractionDigits")

    return (
      <Value
        period="latest"
        id={id}
        visible={visible}
        Component={ValueOnDot}
        fractionDigits={fractionDigits}
      />
    )
  },
  sortingFn: "basic",
})

export const minColumn = () => ({
  id: "min",
  header: (
    <TextMicro strong>
      Min <Units visible />
    </TextMicro>
  ),
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

export const avgColumn = () => ({
  id: "avg",
  header: (
    <TextMicro strong>
      Avg <Units visible />
    </TextMicro>
  ),
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

export const maxColumn = () => ({
  id: "max",
  header: (
    <TextMicro strong>
      Max <Units visible />
    </TextMicro>
  ),
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

export const alertsColumn = () => ({
  id: "alerts",
  header: <TextMicro strong>Alerts</TextMicro>,
  size: 60,
  minSize: 30,
  maxSize: 300,
  fullWidth: true,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.al) return <TextSmall color="textLite">{getValue()}</TextSmall>

    const { cl = 0, cr = 0, wr = 0 } = row.original.info.al

    const pillLeft = { text: cr, flavour: cr ? "error" : "disabledError" }
    const pillRight = { text: wr, flavour: wr ? "warning" : "disabledWarning" }
    const pillEnd = { text: cl, flavour: cl ? "clear" : "disabledClear" }

    return (
      <Flex>
        <MasterCard pillLeft={pillLeft} pillRight={pillRight} pillEnd={pillEnd} />
      </Flex>
    )
  },
  sortingFn: "basic",
})
