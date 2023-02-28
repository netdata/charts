import React, { memo, useMemo } from "react"
import { useChart, useAttribute, useAttributeValue, useMetadata } from "@/components/provider"
import DropdownTable from "./dropdownTable"
import { getStats } from "./utils"
import {
  labelColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
  alertsColumn,
} from "./columns"

const tooltipProps = {
  heading: "Instances",
  body: "View or filter the instances contributing time-series metrics to this chart. This menu also provides the contribution of each instance to the volume of the chart, and a break down of the anomaly rate of the queried data per instance.",
}

const columns = [
  labelColumn(),
  metricsColumn(),
  contributionColumn(),
  anomalyRateColumn(),
  alertsColumn(),
]

const Instances = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedInstances")
  const { nodes, instances } = useMetadata()

  let label = `${instances.length} instances`

  const options = useMemo(
    () =>
      instances.map(instance => {
        const { nm: nodeName, mg: nodeId } = nodes[instance.ni]
        const id = `${instance.id}@${nodeId}`

        const selected = value.includes(id)

        if (selected && value.length === 1) label = instance.nm || instance.id

        return getStats(chart, instance, {
          id,
          key: "instances",
          props: { label: `${instance.nm || instance.id}@${nodeName}`, selected },
        })
      }),
    [instances, value]
  )

  const [sortBy, onSortByChange] = useAttribute("instancesSortBy")

  if (value.length > 1) label = `${value.length} instances`

  return (
    <DropdownTable
      label={label}
      data-track={chart.track("instances")}
      labelProps={labelProps}
      onChange={chart.updateInstancesAttribute}
      options={options}
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      {...rest}
    />
  )
}

export default memo(Instances)
