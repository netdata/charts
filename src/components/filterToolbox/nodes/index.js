import React, { memo, useCallback } from "react"
import {
  useChart,
  useAttribute,
  useAttributeValue,
  useFilteredNodeIds,
} from "@/components/provider"
import DropdownTable from "../dropdownTable"
import { getStats } from "../utils"
import {
  labelColumn,
  instancesColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
  alertsColumn,
  minColumn,
  avgColumn,
  maxColumn,
} from "../columns"
import HostLabelsFilter from "./hostLabelsFilter"

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
  minColumn(),
  avgColumn(),
  maxColumn(),
]

const NodesTable = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedNodes")
  const totalSelected = useFilteredNodeIds()

  const nodes = useAttributeValue("nodes")
  const instances = useAttributeValue("instances")
  const nodesTotals = useAttributeValue("nodesTotals")

  const selectedInstances = useAttributeValue("selectedInstances")

  const getOptions = useCallback(
    () =>
      Object.keys(nodes).map(id => {
        const selected = value.includes(id)

        return getStats(chart, nodes[id], {
          id,
          key: "nodes",
          childrenKey: "instances",
          props: { selected },
          childProps: {
            isInstance: true,
            getValue: instance => `${instance.id}@${id}`,
            getIsSelected: instance => selectedInstances.includes(`${instance.id}@${id}`),
          },
          children: Object.keys(instances).reduce(
            (h, instanceId) =>
              instances[instanceId].ni === nodes[id].ni ? [...h, instances[instanceId]] : h,
            []
          ),
        })
      }),
    [nodes, value, selectedInstances]
  )

  const [sortBy, onSortByChange] = useAttribute("nodesSortBy")
  const [expanded, onExpandedChange] = useAttribute("nodesExpanded")

  const filterSelectedCount = useCallback(values => values.filter(val => !val.isInstance), [])
  const nodesById = useAttributeValue("nodesById")

  return (
    <DropdownTable
      title="Nodes"
      resourceName="node"
      data-track={chart.track("nodes")}
      labelProps={labelProps}
      onChange={chart.updateNodesAttribute}
      getOptions={getOptions}
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      enableSubRowSelection={false}
      totals={nodesTotals}
      filterSelectedCount={filterSelectedCount}
      totalSelected={totalSelected}
      sidebar={!!nodesById && <HostLabelsFilter nodesById={nodesById} />}
      {...rest}
    />
  )
}

export default memo(NodesTable)
