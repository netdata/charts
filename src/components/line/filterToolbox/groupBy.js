import React, { useMemo, memo } from "react"
import { useChart, useAttributeValue } from "@/components/provider"
import DropdownMenu from "./groupByDropdown"

const defaultItems = [
  { label: "dimension", value: "dimension", childrenKey: "dimensions" },
  { label: "node", value: "node", childrenKey: "nodes" },
  { label: "instance", value: "instance", childrenKey: "instances" },
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

const GroupBy = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const groupBy = useAttributeValue("groupBy")
  const groupByLabel = useAttributeValue("groupByLabel")

  const options = useMemo(
    () =>
      defaultItems.map(item => ({
        ...item,
        "data-track": chart.track(`group-by-${item.value}`),
        children: chart.getMetadata()[item.childrenKey].map(v => ({ ...v, id: v.nm })),
      })),
    []
  )

  return (
    <DropdownMenu
      allName="everything"
      data-track={chart.track("group-by")}
      labelProps={labelProps}
      onChange={chart.updateGroupByAttribute}
      options={options}
      secondaryLabel="Group by"
      tooltipProps={tooltipProps}
      value={{ groupBy, groupByLabel }}
      {...rest}
    />
  )
}

export default memo(GroupBy)
