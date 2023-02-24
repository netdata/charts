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
      const { sl, ex } = row.original.host.is
      return (
        <>
          <TextSmall color="textLite">
            <TextSmall color={["green", "deyork"]}>{sl}</TextSmall> out of {sl + ex}
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${(sl / (sl + ex)) * 100}%`}
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
      const { sl, ex } = row.original.host.ds
      return (
        <>
          <TextSmall color="textLite">
            <TextSmall color={["green", "deyork"]}>{sl}</TextSmall> out of {sl + ex}
          </TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${(sl / (sl + ex)) * 100}%`}
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
          <TextSmall color={["green", "deyork"]}>{row.original.host.sts.con}%</TextSmall>
          <ProgressBar
            background="borderSecondary"
            color={["green", "deyork"]}
            height={2}
            width={`${row.original.host.sts.con}%`}
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
      return <Text>{row.original.host.sts.arp}%</Text>
    },
    meta: row => ({
      cellStyles: {
        background: `rgba(0,0,0,${row.original.host.sts.arp})`,
      },
    }),
  },
  {
    id: "alerts",
    header: <TextSmall strong>Chart alerts</TextSmall>,
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { cl, cr, wr } = row.original.host.al
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
      nodes.map(host => {
        const id = isAgent ? host.mg : host.nd

        return {
          label: host.nm || id,
          value: id,
          "data-track": chart.track(`nodes-${id}`),
          host,
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
