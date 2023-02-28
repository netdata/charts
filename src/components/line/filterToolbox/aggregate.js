import React, { memo, useMemo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useAttributeValue, useChart } from "@/components/provider"
import Label from "./label"

const useItems = chart =>
  useMemo(
    () => [
      { value: "avg", label: "Average", short: "AVG()", "data-track": chart.track("avg") },
      { value: "sum", label: "Sum", short: "SUM()", "data-track": chart.track("sum") },
      { value: "min", label: "Min", short: "MIN()", "data-track": chart.track("min") },
      { value: "max", label: "Max", short: "MAX()", "data-track": chart.track("max") },
    ],
    [chart]
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
    <Menu
      value={value}
      onChange={chart.updateAggregationMethodAttribute}
      items={items}
      data-track={chart.track("aggregate")}
      dropProps={{ align: { top: "bottom", left: "left" }, "data-toolbox": true }}
      {...rest}
    >
      <Label
        secondaryLabel="the"
        label={short}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
        {...labelProps}
      />
    </Menu>
  )
}

export default memo(Aggregate)
