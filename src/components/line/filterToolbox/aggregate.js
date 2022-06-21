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
  dimension: {
    heading: "Aggregate function",
    body: "It is applied for the selected dimensions across the nodes.",
  },
  node: {
    heading: "Aggregate function",
    body: "It is applied on all charts from each node for the aggregated dimensions.",
  },
}

const Aggregate = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const value = useAttributeValue("aggregationMethod")
  const groupBy = useAttributeValue("groupBy")

  const items = useItems(chart)

  const { short } = items.find(item => item.value === value) || items[0]

  const tooltipAttrs = tooltipProps[groupBy] || tooltipProps.node

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
        title={tooltipAttrs.heading}
        tooltipProps={tooltipAttrs}
        {...labelProps}
      />
    </Menu>
  )
}

export default memo(Aggregate)
