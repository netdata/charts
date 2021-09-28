import React, { memo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useAttributeValue, useChart } from "@/components/provider"
import Label from "./label"

const items = [
  { value: "avg", label: "Average", short: "AVG()", "data-track": "avg" },
  { value: "sum", label: "Sum", short: "SUM()", "data-track": "sum" },
  { value: "min", label: "Min", short: "MIN()", "data-track": "min" },
  { value: "max", label: "Max", short: "MAX()", "data-track": "max" },
]

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

  const { short } = items.find(item => item.value === value)

  return (
    <Menu
      value={value}
      onChange={chart.updateAggregationMethodAttribute}
      items={items}
      data-track="aggregate"
      {...rest}
    >
      <Label
        secondaryLabel="Select"
        label={short}
        title={tooltipProps[groupBy].heading}
        tooltipProps={tooltipProps[groupBy]}
        {...labelProps}
      />
    </Menu>
  )
}

export default memo(Aggregate)
