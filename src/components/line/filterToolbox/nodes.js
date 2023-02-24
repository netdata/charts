import React, { useMemo } from "react"
import { useChart, useAttributeValue, useMetadata } from "@/components/provider"
import DropdownTable from "./dropdownTable"

const tooltipProps = {
  heading: "Nodes",
  body: "The instances contributing to the chart.",
}

const columns = [
  {
    id: "label",
    header: "Name",
    size: 180,
    minSize: 60,
    cell: ({ getValue }) => getValue(),
  },
  {
    id: "instances",
    header: "Instances",
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { sl, ex } = row.original.host.is
      return `${sl} out of ${sl + ex}`
    },
  },
  {
    id: "metrics",
    header: "Metrics",
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { sl, ex } = row.original.host.ds
      return `${sl} out of ${sl + ex}`
    },
  },
  {
    id: "contribution",
    header: "Contribution %",
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      return `${row.original.host.sts.con}%`
    },
  },
  {
    id: "anomalyRate",
    header: "Anomaly %",
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      return `${row.original.host.sts.arp}%`
    },
  },
  {
    id: "alerts",
    header: "Chart alerts",
    size: 100,
    minSize: 30,
    cell: ({ row }) => {
      const { cl, cr, wr } = row.original.host.al
      return `cr: ${cr}, wr: ${wr}, cl: ${cl}`
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
