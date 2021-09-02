import React, { memo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useAttributeValue, useChart } from "@/components/provider"
import Label from "./label"

const items = [
  { value: "avg", label: "Average", short: "AVG()" },
  { value: "sum", label: "Sum", short: "SUM()" },
  { value: "min", label: "Min", short: "MIN()" },
  { value: "max", label: "Max", short: "MAX()" },
]

const Aggregate = () => {
  const chart = useChart()
  const value = useAttributeValue("aggregationMethod")

  const { short } = items.find(item => item.value === value)

  return (
    <Menu value={value} onChange={chart.updateAggregationMethodAttribute} items={items}>
      <Label secondaryLabel="Select" label={short} />
    </Menu>
  )
}

export default memo(Aggregate)
