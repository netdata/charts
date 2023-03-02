import React, { memo, useMemo } from "react"
import { TextSmall } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"
import Dropdown from "./dropdownSingleSelect"

const useItems = chart =>
  useMemo(
    () => [
      {
        value: "avg",
        label: "Average",
        description:
          "For each point presented, calculate the average of the metrics contributing to it.",
        short: "AVG()",
        "data-track": chart.track("avg"),
      },
      {
        value: "sum",
        label: "Sum",
        description:
          "For each point presented, calculate the sum of the metrics contributing to it.",
        short: "SUM()",
        "data-track": chart.track("sum"),
      },
      {
        value: "min",
        label: "Minimum",
        description:
          "For each point presented, present the minimum of the metrics contributing to it.",
        short: "MIN()",
        "data-track": chart.track("min"),
      },
      {
        value: "max",
        label: "Maximum",
        description:
          "For each point presented, present the maximum of the metrics contributing to it.",
        short: "MAX()",
        "data-track": chart.track("max"),
      },
    ],
    [chart]
  )

const dropTitle = (
  <TextSmall padding={[0, 0, 2]}>
    When aggregating multiple multiple source time-series metrics to one visible dimension on the
    chart, use the following aggregation function
  </TextSmall>
)

const tooltipProps = {
  heading: "Metrics aggregation",
  body: "View or select the aggregation function applied when multiple source time-series metrics need to be grouped together to be presented as dimensions on this chart.",
}

const Aggregate = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("aggregationMethod")

  const items = useItems(chart)

  const { short } = items.find(item => item.value === value) || items[0]

  return (
    <Dropdown
      value={value}
      onChange={chart.updateAggregationMethodAttribute}
      items={items}
      data-track={chart.track("aggregate")}
      dropTitle={dropTitle}
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

export default memo(Aggregate)
