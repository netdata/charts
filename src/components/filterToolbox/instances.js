import { memo, useCallback, useMemo } from "react"
import { useChart, useAttribute, useAttributeValue } from "@/components/provider"
import { uppercase } from "@/helpers/objectTransform"
import DropdownTable from "./dropdownTable"
import { getStats, getInstanceLabel } from "./utils"
import {
  labelColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
  alertsColumn,
  minColumn,
  avgColumn,
  maxColumn,
  rangeColumn,
} from "./columns"

const useTooltipProps = chart =>
  useMemo(
    () => ({
      heading: uppercase(chart.intl("instance", { count: 2 })),
      body: `View or filter the ${chart.intl("instance", {
        count: 2,
      })} contributing time-series metrics to this chart. This menu also provides the contribution of each ${chart.intl(
        "instance"
      )} to the volume of the chart, and a break down of the anomaly rate of the queried data per ${chart.intl(
        "instance"
      )}.`,
    }),
    []
  )

const columns = [
  labelColumn(),
  metricsColumn(),
  contributionColumn(),
  anomalyRateColumn(),
  alertsColumn(),
  minColumn(),
  avgColumn(),
  maxColumn(),
  rangeColumn(),
]

const hasAlias = nodesById => !!nodesById && Object.values(nodesById).some(node => node?.name)

const Instances = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedInstances")
  const instances = useAttributeValue("instances")
  const instancesTotals = useAttributeValue("instancesTotals")
  const nodes = useAttributeValue("nodes")
  const nodesById = useAttributeValue("nodesById")

  const getOptions = useCallback(() => {
    const nodeIdsByIndex = {}
    if (hasAlias(nodesById)) Object.keys(nodes).forEach(id => (nodeIdsByIndex[nodes[id].ni] = id))

    return Object.keys(instances).map(id =>
      getStats(chart, instances[id], {
        id,
        key: "instances",
        props: {
          selected: value.includes(id),
          getLabel: instance => {
            const nodeId = nodeIdsByIndex[instance.ni]

            return nodeId && getInstanceLabel(chart, nodeId, nodes[nodeId], instance)
          },
        },
      })
    )
  }, [instances, value, nodes, nodesById])

  const [sortBy, onSortByChange] = useAttribute("instancesSortBy")
  const tooltipProps = useTooltipProps(chart)

  return (
    <DropdownTable
      title={uppercase(chart.intl("instance", { count: 2 }))}
      resourceName="instance"
      data-track={chart.track("instances")}
      labelProps={labelProps}
      onChange={chart.updateInstancesAttribute}
      getOptions={getOptions}
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      totals={instancesTotals}
      {...rest}
    />
  )
}

export default memo(Instances)
