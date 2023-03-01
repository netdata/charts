import React, { memo, useMemo } from "react"
import { useChart, useAttribute, useAttributeValue, useMetadata } from "@/components/provider"
import DropdownTable from "./dropdownTable"
import { getStats } from "./utils"

import { labelColumn, metricsColumn, contributionColumn, anomalyRateColumn } from "./columns"

const tooltipProps = {
  heading: "Dimensions",
  body: "View or filter the original dimensions contributing time-series metrics to this chart. This menu also presents the contribution of each original dimension on the chart, and a break down of the anomaly rate of the data per dimension.",
}

const columns = [labelColumn(), metricsColumn(), contributionColumn(), anomalyRateColumn()]

const Dimensions = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("selectedDimensions")
  const { dimensions, dimensionsTotals } = useMetadata()

  let label = `${dimensions.length} dimensions`

  const options = useMemo(
    () =>
      dimensions.map(dimension => {
        const selected = value.includes(dimension.id)

        if (selected && value.length === 1) label = dimension.nm || dimension.id

        return getStats(chart, dimension, {
          key: "dimensions",
          props: { selected },
        })
      }),
    [dimensions, value]
  )

  const [sortBy, onSortByChange] = useAttribute("nodesSortBy")

  if (value.length > 1) label = `${value.length} dimensions`

  return (
    <DropdownTable
      label={label}
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
