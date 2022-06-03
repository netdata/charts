import React, { memo, useMemo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useAttributeValue, useChart } from "@/components/provider"
import Label from "./label"

const useItems = chart =>
  useMemo(
    () => [
      { value: "min", label: "Min", short: "MIN()", "data-track": chart.track("time-aggregation-min") },
      { value: "max", label: "Max", short: "MAX()", "data-track": chart.track("time-aggregation-max") },
      { value: "average", label: "Average", short: "AVG()", "data-track": chart.track("time-aggregation-average") },
      { value: "sum", label: "Sum", short: "SUM()", "data-track": chart.track("time-aggregation-sum") },
      { value: "incremental_sum", label: "Incremental sum (Delta)", short: "DELTA()", "data-track": chart.track("time-aggregation-incremental-sum") },
      { value: "stddev", label: "Standard deviation", short: "STDDEV()", "data-track": chart.track("time-aggregation-stddev") },
      { value: "median", label: "Median", short: "MEDIAN()", "data-track": chart.track("time-aggregation-median") },
      { value: "ses", label: "Single exponential smoothing", short: "SES()", "data-track": chart.track("time-aggregation-ses") },
      { value: "des", label: "Double exponential smoothing", short: "DES()", "data-track": chart.track("time-aggregation-des") },
      { value: "cv", label: "Coefficient variation", short: "CV()", "data-track": chart.track("time-aggregation-cv") },
    ],
    [chart]
  )

const tooltipProps = {
  dimension: {
    heading: "Aggregation function over time",
    body: "The aggregation function over time, for each of the metrics contributing to this query",
  },
}

const TimeAggregation = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("groupingMethod")
  const { updateEvery = 0 } = chart.getMetadata()

  const items = useItems(chart)

  const { short } = items.find(item => item.value === value) || items[0]

  return (
    <Menu
      value={value}
      onChange={chart.updateTimeAggregationMethodAttribute}
      items={items}
      data-track={chart.track("groupingMethod")}
      dropProps={{ align: { top: "bottom", right: "right" }, "data-toolbox": true }}
      {...rest}
    >
      <Label
        secondaryLabel="each as"
        tertiaryLabel={`every ${updateEvery}s`}
        label={short}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default memo(TimeAggregation)
