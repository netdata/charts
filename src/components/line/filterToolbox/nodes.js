import React, { useMemo } from "react"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import DropdownTable from "./dropdownTable"
import { ProgressBar, Text, TextSmall, AlertMasterCard } from "@netdata/netdata-ui"

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
    cell: ({ getValue }) => getValue(),
  },
  {
    id: "instances",
    header: <TextSmall strong>Instances</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { qr, sl, ex } = row.original.node.is
      return (
        <>
          <TextSmall color="textLite">
            <TextSmall color={["green", "deyork"]}>{qr}</TextSmall> out of {sl + ex}
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
    cell: ({ row }) => {
      const { qr, sl, ex } = row.original.node.ds
      return (
        <>
          <TextSmall color="textLite">
            <TextSmall color={["green", "deyork"]}>{qr}</TextSmall> out of {sl + ex}
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
    cell: ({ row }) => {
      return (
        <>
          <TextSmall color={["green", "deyork"]}>
            {Math.round((row.original.node.sts.con + Number.EPSILON) * 100) / 100}%
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${row.original.node.sts.con}%`}
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
    cell: ({ row }) => {
      return <Text>{Math.round((row.original.node.sts.arp + Number.EPSILON) * 100) / 100}%</Text>
    },
    meta: row => ({
      cellStyles: {},
    }),
  },
  {
    id: "alerts",
    header: <TextSmall strong>Chart alerts</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { cl, cr, wr } = row.original.node.al
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
  const { nodes } = useMetadata()
  const options = useMemo(
    () =>
      nodes.map(node => {
        const id = isAgent ? node.mg : node.nd

        return {
          label: node.nm || id,
          value: id,
          "data-track": chart.track(`nodes-${id}`),
          instances: node.is.qr + node.is.qr / (node.is.ex + node.is.sl),
          metrics: node.ds.qr + node.ds.qr / (node.ds.ex + node.ds.sl),
          contribution: node.sts.con,
          anomalyRate: node.sts.arp,
          alerts: node.al.cr * 3 + node.al.wr * 2 + node.al.cl,
          node,
        }
      }),
    [nodes]
  )

  return (
    <DropdownTable
      allName="all nodes"
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

export default Nodes
