import React, { useMemo, memo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useChart, useAttributeValue } from "@/components/provider"
import Label from "./label"

const defaultItems = ["dimension", "node", "chart"]

const tooltipProps = {
  heading: "Grouping by",
  body: (
    <div>
      Select the grouping by:
      <ul>
        <li>Nodes to drill down and see metrics across nodes</li>
        <li>Dimension to have an overview of your War Room</li> Chart to drill down to the
        individual charts.
        <li>
          If a node has more than one software or hardware instance these form different charts
        </li>
      </ul>
    </div>
  ),
}

const GroupBy = () => {
  const chart = useChart()
  const value = useAttributeValue("groupBy")

  const items = useMemo(() => {
    const { chartLabels } = chart.getMetadata()
    return [...defaultItems, ...Object.keys(chartLabels)].map(value => ({
      value,
      label: `By ${value}`,
      "data-track": chart.track(`group-by-${value}`),
    }))
  }, [chart])

  return (
    <Menu
      value={value}
      onChange={chart.updateGroupByAttribute}
      items={items}
      data-track={chart.track("groupBy")}
    >
      <Label
        secondaryLabel="Group by"
        label={value}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
      />
    </Menu>
  )
}

export default memo(GroupBy)
