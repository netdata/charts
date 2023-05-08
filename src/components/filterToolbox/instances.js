import React, { memo, useCallback, useMemo } from "react"
import { useChart, useAttribute, useAttributeValue } from "@/components/provider"
import { uppercase } from "@/helpers/objectTransform"
import DropdownTable from "./dropdownTable"
import { getStats } from "./utils"
import {
  labelColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
  alertsColumn,
  minColumn,
  avgColumn,
  maxColumn,
} from "./columns"

const useTooltipProps = chart =>
  useMemo(
    () => ({
      heading: uppercase(chart.intl("instance", 2)),
      body: `View or filter the ${chart.intl(
        "instance",
        2
      )} contributing time-series metrics to this chart. This menu also provides the contribution of each ${chart.intl(
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
]

const Instances = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedInstances")
  const instances = useAttributeValue("instances")
  const instancesTotals = useAttributeValue("instancesTotals")

  const getOptions = useCallback(
    () =>
      Object.keys(instances).map(id =>
        getStats(chart, instances[id], {
          id,
          key: "instances",
          props: { selected: value.includes(id) },
        })
      ),
    [instances, value]
  )

  const [sortBy, onSortByChange] = useAttribute("instancesSortBy")
  const tooltipProps = useTooltipProps(chart)

  return (
    <DropdownTable
      title={uppercase(chart.intl("instance", 2))}
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
