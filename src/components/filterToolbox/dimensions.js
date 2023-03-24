import React, { memo, useMemo } from "react"
import { useChart, useAttribute, useAttributeValue, useMetadata } from "@/components/provider"
import DropdownTable from "./dropdownTable"
import { getStats } from "./utils"

import {
  labelColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
  minColumn,
  avgColumn,
  maxColumn,
} from "./columns"

const tooltipProps = {
  heading: "Dimensions",
  body: "View or filter the original dimensions contributing time-series metrics to this chart. This menu also presents the contribution of each original dimension on the chart, and a break down of the anomaly rate of the data per dimension.",
}

const columns = [
  labelColumn(),
  metricsColumn(),
  contributionColumn(),
  anomalyRateColumn(),
  minColumn(),
  avgColumn(),
  maxColumn(),
]

const Dimensions = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedDimensions")
  const { dimensions, dimensionsTotals } = useMetadata()

  const options = useMemo(
    () =>
      Object.keys(dimensions).map(id => {
        const selected = value.includes(id)

        return getStats(chart, dimensions[id], {
          key: "dimensions",
          props: { selected },
        })
      }),
    [dimensions, value]
  )

  const [sortBy, onSortByChange] = useAttribute("nodesSortBy")

  return (
    <DropdownTable
      title="Dimensions"
      resourceName="dimension"
      data-track={chart.track("dimensions")}
      labelProps={labelProps}
      onChange={chart.updateDimensionsAttribute}
      options={options}
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      totals={dimensionsTotals}
      {...rest}
    />
  )
}

export default memo(Dimensions)
