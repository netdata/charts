import React from "react"
import { Flex, ProgressBar, TextSmall, MasterCard } from "@netdata/netdata-ui"
import Color from "@/components/line/dimensions/color"
import Label from "./label"

const metricsByValue = {
  dimension: "dimensions",
  node: "nodes",
  instance: "instances",
  label: "labels",
  value: "values",
  default: "values",
}

export const labelColumn = fallbackExpandKey => ({
  id: "label",
  header: () => <TextSmall strong>Name</TextSmall>,
  size: 300,
  minSize: 60,
  cell: ({ getValue, row }) => (
    <Flex justifyContent="between" alignItems="center" padding={[0, 0, 0, row.depth * 3]}>
      <Flex gap={1}>
        <Color id={row.original.value} />
        <TextSmall
          strong
          onClick={!row.original.disabled ? row.getToggleSelectedHandler() : undefined}
          cursor={row.original.disabled ? "default" : "pointer"}
          whiteSpace="normal"
        >
          {getValue()}
        </TextSmall>
      </Flex>
      {row.getCanExpand() && (
        <Label
          label={
            metricsByValue[row.original.value] ||
            metricsByValue[fallbackExpandKey] ||
            metricsByValue.default
          }
          onClick={e => {
            row.getToggleExpandedHandler()(e)
            setTimeout(() => e.target.scrollIntoView({ behavior: "smooth", block: "nearest" }))
          }}
          iconRotate={row.getIsExpanded() ? 2 : null}
          textProps={{ fontSize: "10px", color: "textLite" }}
        />
      )}
    </Flex>
  ),
})

export const uniqueColumn = () => ({
  id: "unique",
  header: <TextSmall strong>Unique</TextSmall>,
  size: 45,
  minSize: 30,
  cell: ({ getValue }) => <TextSmall color="textLite">{getValue()}</TextSmall>,
  sortingFn: "basic",
})

export const minColumn = () => ({
  id: "min",
  header: <TextSmall strong>Min</TextSmall>,
  size: 60,
  minSize: 30,
  cell: ({ getValue }) => <TextSmall color="textLite">{getValue()}</TextSmall>,
  sortingFn: "basic",
})

export const avgColumn = () => ({
  id: "avg",
  header: <TextSmall strong>Avg</TextSmall>,
  size: 60,
  minSize: 30,
  cell: ({ getValue }) => <TextSmall color="textLite">{getValue()}</TextSmall>,
  sortingFn: "basic",
})

export const maxColumn = () => ({
  id: "max",
  header: <TextSmall strong>Max</TextSmall>,
  size: 60,
  minSize: 30,
  cell: ({ getValue }) => <TextSmall color="textLite">{getValue()}</TextSmall>,
  sortingFn: "basic",
})

export const instancesColumn = () => ({
  id: "instances",
  header: <TextSmall strong>Instances</TextSmall>,
  size: 60,
  minSize: 30,
  cell: ({ getValue, row }) => {
    if (!row.original.info?.is) return <TextSmall color="textLite">{getValue()}</TextSmall>

    const { qr = 0, sl = 0, ex = 0 } = row.original.info.is
    return (
      <>
        <TextSmall color="textLite">
          <TextSmall color="primary">{qr}</TextSmall> out of {sl + ex}
        </TextSmall>
        <ProgressBar
          background="progressBg"
          color={["green", "deyork"]}
          height={2}
          width={`${(qr / (sl + ex)) * 100}%`}
          containerWidth="100%"
          border="none"
        />
      </>
    )
  },
  sortingFn: "basic",
})

export const metricsColumn = () => ({
  id: "metrics",
  header: <TextSmall strong>Metrics</TextSmall>,
  size: 60,
  minSize: 30,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.ds) return <TextSmall color="textLite">{getValue()}</TextSmall>

    const { qr = 0, sl = 0, ex = 0 } = row.original.info.ds
    return (
      <>
        <TextSmall color="textLite">
          <TextSmall color="primary">{qr}</TextSmall> out of {sl + ex}
        </TextSmall>
        <ProgressBar
          background="progressBg"
          color={["green", "deyork"]}
          height={2}
          width={`${(qr / (sl + ex)) * 100}%`}
          containerWidth="100%"
          border="none"
        />
      </>
    )
  },
  sortingFn: "basic",
})

export const contributionColumn = () => ({
  id: "contribution",
  header: <TextSmall strong>Vol %</TextSmall>,
  size: 50,
  minSize: 30,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.sts) return <TextSmall color="textLite">{getValue()}</TextSmall>

    return (
      <>
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
      </>
    )
  },
  sortingFn: "basic",
})

export const anomalyRateColumn = () => ({
  id: "anomalyRate",
  header: <TextSmall strong>AR %</TextSmall>,
  size: 50,
  minSize: 30,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.sts) return <TextSmall color="textLite">{getValue()}</TextSmall>

    return (
      <>
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
      </>
    )
  },
  sortingFn: "basic",
})

export const alertsColumn = () => ({
  id: "alerts",
  header: <TextSmall strong>Alerts</TextSmall>,
  size: 50,
  minSize: 50,
  cell: ({ row, getValue }) => {
    if (!row.original.info?.al) return <TextSmall color="textLite">{getValue()}</TextSmall>

    const { cl = 0, cr = 0, wr = 0 } = row.original.info.al

    const pillLeft = { text: cr, flavour: cr ? "error" : "disabledError" }
    const pillRight = { text: wr, flavour: wr ? "warning" : "disabledWarning" }
    const pillEnd = { text: cl, flavour: cl ? "clear" : "disabledClear" }

    return (
      <div>
        <Flex flex={false}>
          <MasterCard pillLeft={pillLeft} pillRight={pillRight} pillEnd={pillEnd} />
        </Flex>
      </div>
    )
  },
  sortingFn: "basic",
})
