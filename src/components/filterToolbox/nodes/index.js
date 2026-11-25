import { memo, useCallback } from "react"
import {
  useChart,
  useAttribute,
  useAttributeValue,
  useFilteredNodeIds,
} from "@/components/provider"
import useInstanceLabels from "@/components/instanceIdentity/useInstanceLabels"
import useInstanceIdentities from "@/components/instanceIdentity/useInstanceIdentities"
import DropdownTable from "../dropdownTable"
import { getStats, getNodeLabel, getInstanceLabel } from "../utils"
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
  rangeColumn,
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
  rangeColumn(),
]

const NodesTable = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedNodes")
  const totalSelected = useFilteredNodeIds()

  const nodes = useAttributeValue("nodes")
  const instances = useAttributeValue("instances")
  const nodesTotals = useAttributeValue("nodesTotals")
  const nodesById = useAttributeValue("nodesById")

  const selectedInstances = useAttributeValue("selectedInstances")
  const getIdentityProps = useInstanceIdentities()
  const loadInstanceLabels = useInstanceLabels()

  const getOptions = useCallback(
    () =>
      Object.keys(nodes).map(id => {
        const selected = value.includes(id)

        return getStats(chart, nodes[id], {
          id,
          key: "nodes",
          childrenKey: "instances",
          props: { selected, getLabel: () => getNodeLabel(chart, id, nodes[id]) },
          childProps: {
            isInstance: true,
            getLabel: instance => getInstanceLabel(chart, id, nodes[id], instance),
            getValue: instance => `${instance.id}@${id}`,
            getIsSelected: instance => selectedInstances.includes(`${instance.id}@${id}`),
            getProps: instance => getIdentityProps(`${instance.id}@${id}`),
          },
          children: Object.keys(instances).reduce(
            (h, instanceId) =>
              instances[instanceId].ni === nodes[id].ni ? [...h, instances[instanceId]] : h,
            []
          ),
        })
      }),
    [nodes, value, selectedInstances, nodesById, getIdentityProps]
  )

  const [sortBy, onSortByChange] = useAttribute("nodesSortBy")
  const [expanded, onExpandedChange] = useAttribute("nodesExpanded")

  const filterSelectedCount = useCallback(values => values.filter(val => !val.isInstance), [])

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
      onOpen={loadInstanceLabels}
      totals={nodesTotals}
      filterSelectedCount={filterSelectedCount}
      totalSelected={totalSelected}
      sidebar={!!nodesById && <HostLabelsFilter nodesById={nodesById} />}
      {...rest}
    />
  )
}

export default memo(NodesTable)
