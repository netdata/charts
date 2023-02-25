import React, { memo, useMemo } from "react"
import { ProgressBar, Text, TextSmall, AlertMasterCard, Flex } from "@netdata/netdata-ui"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import Color from "@/components/line/dimensions/color"
import DropdownTable from "./dropdownTable"
import Label from "./label"

const tooltipProps = {
  heading: "Nodes",
  body: "The instances contributing to the chart.",
}

const columns = [
  {
    id: "label",
    header: <TextSmall strong>Name</TextSmall>,
    size: 180,
    minSize: 60,
    cell: ({ getValue, row }) => (
      <Flex justifyContent="between" alignItems="center" padding={[0, 0, 0, row.depth * 3]} gap={1}>
        <Flex gap={1}>
          <Color id={row.original.value} />
          <TextSmall
            strong={row.getCanExpand()}
            onClick={!row.original.disabled ? row.getToggleSelectedHandler() : undefined}
            cursor={row.original.disabled ? "default" : "pointer"}
          >
            {getValue()}
          </TextSmall>
        </Flex>
        {row.getCanExpand() && (
          <Label
            label="show instances"
            onClick={row.getToggleExpandedHandler()}
            iconRotate={row.getIsExpanded() ? 2 : null}
            textProps={{ fontSize: "10px", color: "textLite" }}
          />
        )}
      </Flex>
    ),
  },
  {
    id: "instances",
    header: <TextSmall strong>Instances</TextSmall>,
    size: 100,
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
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${(qr / (sl + ex)) * 100}%`}
            containerWidth="100%"
            border="none"
          />
        </>
      )
    },
  },
  {
    id: "metrics",
    header: <TextSmall strong>Metrics</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ getValue, row }) => {
      if (!row.original.info?.ds) return <TextSmall color="textLite">{getValue()}</TextSmall>

      const { qr = 0, sl = 0, ex = 0 } = row.original.info.ds
      return (
        <>
          <TextSmall color="textLite">
            <TextSmall color="primary">{qr}</TextSmall> out of {sl + ex}
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${(qr / (sl + ex)) * 100}%`}
            containerWidth="100%"
            border="none"
          />
        </>
      )
    },
  },
  {
    id: "contribution",
    header: <TextSmall strong>Contribution %</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ getValue, row }) => {
      if (!row.original.info?.sts) return <TextSmall color="textLite">{getValue()}</TextSmall>

      return (
        <>
          <TextSmall color="primary">
            {Math.round((getValue() + Number.EPSILON) * 100) / 100}%
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${row.original.info.sts.con}%`}
            containerWidth="100%"
            border="none"
          />
        </>
      )
    },
  },
  {
    id: "anomalyRate",
    header: <TextSmall strong>Anomaly %</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ getValue, row }) => {
      if (!row.original.info?.sts) return <TextSmall color="textLite">{getValue()}</TextSmall>

      return <TextSmall>{Math.round((getValue() + Number.EPSILON) * 100) / 100}%</TextSmall>
    },
    meta: row => ({
      cellStyles: {
        ...(row.original.info?.sts?.arp > 0 && {
          backgroundColor: `rgba(222, 189, 255, ${row.original.info.sts.arp / 100})`,
        }),
      },
    }),
  },
  {
    id: "alerts",
    header: <TextSmall strong>Chart alerts</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ getValue, row }) => {
      if (!row.original.info?.al) return <TextSmall color="textLite">{getValue()}</TextSmall>

      const { cl = 0, cr = 0, wr = 0 } = row.original.info.al
      const pillLeft = {
        type: "critical",
      }
      const pillRight = {
        type: "critical",
      }
      return (
        <>
          <Text>
            cr: {cr}, wr: {wr}, cl: {cl}
          </Text>
        </>
      )
    },
  },
]

const Nodes = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedNodes")
  const isAgent = chart.getAttributes("agent")
  const { nodes, instances } = useMetadata()
  let label = "all nodes"

  const options = useMemo(
    () =>
      nodes.map(node => {
        const id = isAgent ? node.mg : node.nd
        const selected = value.includes(id)

        if (selected && value.length === 1) label = node.nm || id

        return {
          label: node.nm || id,
          value: id,
          "data-track": chart.track(`nodes-${id}`),
          instances: node.is ? node.is.qr + node.is.qr / (node.is.ex + node.is.sl) : "-",
          metrics: node.ds ? node.ds.qr + node.ds.qr / (node.ds.ex + node.ds.sl) : "-",
          contribution: node.sts?.con || 0,
          anomalyRate: node.sts?.arp || 0,
          alerts: node.al ? node.al.cr * 3 + node.al.wr * 2 + node.al.cl : "-",
          info: node,
          selected,
          children: instances
            .filter(dim => dim.mg === node.mg)
            .map(dim => ({
              label: dim.nm || dim.id,
              value: dim.id,
              instances: dim.is ? dim.is.qr + dim.is.qr / (dim.is.ex + dim.is.sl) : "-",
              metrics: dim.ds ? dim.ds.qr + dim.ds.qr / (dim.ds.ex + dim.ds.sl) : "-",
              contribution: dim.sts?.con || 0,
              anomalyRate: dim.sts?.arp || 0,
              alerts: dim.al ? dim.al.cr * 3 + dim.al.wr * 2 + dim.al.cl : "-",
              info: dim,
              isInstance: true,
            })),
        }
      }),
    [nodes, value]
  )

  if (value.length > 1) label = `${value.length} nodes`

  return (
    <DropdownTable
      label={label}
      data-track={chart.track("nodes")}
      labelProps={labelProps}
      onChange={chart.updateNodesAttribute}
      options={options}
      secondaryLabel="of"
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      {...rest}
    />
  )
}

export default memo(Nodes)
