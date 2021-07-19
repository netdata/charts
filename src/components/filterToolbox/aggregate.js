import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import React from "react"
import { useAttribute } from "@/components/provider"
import Label from "./label"

const items = [
  { value: "avg", label: "Average", short: "AVG()" },
  { value: "sum", label: "Sum", short: "SUM()" },
  { value: "min", label: "Min", short: "MIN()" },
  { value: "max", label: "Max", short: "MAX()" },
]

const Aggregate = () => {
  const [aggregateMethod, setAggregateMethod] = useAttribute("aggregateMethod")

  const { short } = items.find(item => item.value === aggregateMethod) || items[0]

  return (
    <Menu value={aggregateMethod} onChange={setAggregateMethod} items={items}>
      <Label secondaryLabel="Select" label={short} />
    </Menu>
  )
}

export default Aggregate
