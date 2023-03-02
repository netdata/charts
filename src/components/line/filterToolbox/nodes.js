import React, { memo, useMemo } from "react"
import { useChart, useAttribute, useAttributeValue, useMetadata } from "@/components/provider"
import DropdownTable from "./dropdownTable"
import { getStats } from "./utils"
import {
  labelColumn,
  instancesColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
  alertsColumn,
} from "./columns"

const tooltipProps = {
  heading: "Nodes",
  body: "View or filter the nodes contributing time-series metrics to this chart. This menu also provides the contribution of each node to the volume of the chart, and a break down of the anomaly rate of the queried data per node.",
}

const columns = [
  labelColumn("instance"),
  instancesColumn(),
  metricsColumn(),
  contributionColumn(),
  anomalyRateColumn(),
  alertsColumn(),
]

const Nodes = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedNodes")
  const isAgent = chart.getAttributes("agent")
  const { nodes, instances, nodesTotals } = useMetadata()
  let label = `${nodes.length} nodes`

  const selectedInstances = useAttributeValue("selectedInstances")

  const options = useMemo(
    () =>
      nodes.map(node => {
        const id = isAgent ? node.mg : node.nd
        const selected = value.includes(id)

        if (selected && value.length === 1) label = node.nm || id

        return getStats(chart, node, {
          id,
          key: "nodes",
          childrenKey: "instances",
          props: { selected },
          childProps: {
            isInstance: true,
            getValue: instance => `${instance.nm || instance.id}@${node.mg}`,
            getIsSelected: instance =>
              selectedInstances.includes(`${instance.nm || instance.id}@${node.mg}`),
          },
          children: instances.filter(dim => dim.ni === node.ni),
        })
      }),
    [nodes, value, selectedInstances]
  )

  const [sortBy, onSortByChange] = useAttribute("nodesSortBy")
  const [expanded, onExpandedChange] = useAttribute("nodesExpanded")

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
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      enableSubRowSelection={false}
      totals={nodesTotals}
      {...rest}
    />
  )
}

export default memo(Nodes)
