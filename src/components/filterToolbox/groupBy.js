import React, { useMemo, memo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useChart, useAttributeValue } from "@/components/provider"
import Label from "./label"

const defaultItems = ["dimension", "node", "chart"]

const GroupBy = () => {
  const chart = useChart()
  const value = useAttributeValue("groupBy")

  const items = useMemo(() => {
    const { chartLabels } = chart.getMetadata()
    return [...defaultItems, ...Object.keys(chartLabels)].map(value => ({
      value,
      label: `By ${value}`,
    }))
  }, [chart])

  return (
    <Menu value={value} onChange={chart.updateGroupByAttribute} items={items}>
      <Label secondaryLabel="Group by" label={value} />
    </Menu>
  )
}

export default memo(GroupBy)
