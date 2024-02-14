import React, { memo, useMemo } from "react"
import { useAttributeValue, useChart } from "@/components/provider"
import Dropdown from "./dropdownSingleSelect"

const useItems = chart =>
  useMemo(
    () => [
      {
        value: "avg",
        label: "Average",
        description: "For each aggregated point, calculate the average of the metrics.",
        short: "AVG()",
        "data-track": chart.track("avg"),
      },
      {
        value: "sum",
        label: "Sum",
        description: "For each aggregated point, calculate the sum of the metrics.",
        short: "SUM()",
        "data-track": chart.track("sum"),
      },
      {
        value: "min",
        label: "Minimum",
        description: "For each aggregated point, present the minimum of the metrics.",
        short: "MIN()",
        "data-track": chart.track("min"),
      },
      {
        value: "max",
        label: "Maximum",
        description: "For each aggregated point, present the maximum of the metrics.",
        short: "MAX()",
        "data-track": chart.track("max"),
      },
    ],
    [chart]
  )

const tooltipProps = {
  heading: "Metrics post aggregation",
}

const PostAggregate = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("postAggregationMethod")

  const items = useItems(chart)

  const { short } = items.find(item => item.value === value) || items[0]

  return (
    <Dropdown
      value={value}
      onChange={chart.updatePostAggregationMethodAttribute}
      items={items}
      data-track={chart.track("post-aggregate")}
      {...rest}
      labelProps={{
        secondaryLabel: "the",
        label: short,
        title: tooltipProps.heading,
        tooltipProps,
        ...labelProps,
      }}
    />
  )
}

export default memo(PostAggregate)
