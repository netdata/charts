import React, { useMemo, memo } from "react"
import Menu from "@netdata/netdata-ui/lib/components/drops/menu"
import { useChart, useAttributeValue } from "@/components/provider"
import Label from "./label"

const defaultItems = [
  { label: "dimension", value: "dimension" },
  { label: "node", value: "node" },
  { label: "instance", value: "chart" },
]

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
  const { chartLabels } = chart.getMetadata()

  const items = useMemo(
    () => [
      ...defaultItems.map(value => ({
        ...value,
        "data-track": chart.track(`group-by-${value.value}`),
      })),
      ...Object.keys(chartLabels).map(value => ({
        value,
        label: value,
        "data-track": chart.track(`group-by-${value}`),
      })),
    ],
    [chartLabels]
  )
  const selected = useMemo(() => items.find(item => item.value === value) || item[0], [value])

  return (
    <Menu
      value={value}
      onChange={chart.updateGroupByAttribute}
      items={items}
      data-track={chart.track("groupBy")}
    >
      <Label
        secondaryLabel="Group by"
        label={selected?.label || "Loading"}
        title={tooltipProps.heading}
        tooltipProps={tooltipProps}
      />
    </Menu>
  )
}

export default memo(GroupBy)
