import React, { useMemo, memo } from "react"
import { useChart, useAttribute, useAttributeValue } from "@/components/provider"
import DropdownTable from "./dropdownTable"
import { getStats } from "./utils"
import {
  labelColumn,
  uniqueColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
} from "./columns"

const defaultItems = [
  { nm: "dimension", id: "dimension", key: "dimensions" },
  { nm: "node", id: "node", key: "nodes" },
  { nm: "instance", id: "instance", key: "instances" },
]

const tooltipProps = {
  heading: "Group by",
  body: "Slice and dice the source time-series metrics in multiple ways, to get different viewing angles on them. Multiple groupings can be selected at the same time to fine tune the segmentation.",
}

const columns = [
  labelColumn("label"),
  uniqueColumn(),
  metricsColumn(),
  contributionColumn(),
  anomalyRateColumn(),
]

const GroupBy = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const groupBy = useAttributeValue("groupBy")
  const groupByLabel = useAttributeValue("groupByLabel")

  let label = "everything"

  const options = useMemo(() => {
    const metadata = chart.getMetadata()

    const defaultOptions = defaultItems.map(item => {
      const selected = groupBy.includes(item.id)

      return getStats(chart, item, {
        key: "group-by",
        childrenKey: "label",
        props: {
          contribution: "-",
          anomalyRate: "-",
          alerts: "-",
          selected,
        },
        childProps: { unique: "-", disabled: "hidden" },
        children: metadata[item.key],
      })
    })

    return [
      ...defaultOptions,
      ...metadata.labels.map(item =>
        getStats(chart, item, {
          key: "group-by",
          childrenKey: "label",
          props: { isLabel: true, selected: groupByLabel.includes(item.id) },
          childProps: { unique: "-", disabled: "hidden" },
          children: item.vl,
        })
      ),
    ]
  }, [groupBy, groupByLabel])

  label = useMemo(() => {
    const withoutNodes = groupBy.filter(v => v !== "node")

    const groups = withoutNodes.map(v => {
      if (v === "label")
        return groupByLabel.length > 1 ? `${groupByLabel.length} labels` : groupByLabel[0]

      return v
    })
    if (withoutNodes.length < groupBy.length) groups.push("node")

    return groups.join(", ")
  }, [groupBy, groupByLabel])

  const value = useMemo(() => [...groupBy, ...groupByLabel], [groupBy, groupByLabel])

  const [sortBy, onSortByChange] = useAttribute("groupBySortBy")
  const [expanded, onExpandedChange] = useAttribute("groupByExpanded")

  return (
    <DropdownTable
      label={label}
      data-track={chart.track("group-by")}
      labelProps={labelProps}
      onChange={chart.updateGroupByAttribute}
      options={options}
      secondaryLabel="Group by"
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      enableSubRowSelection={false}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      emptyMessage="Deselecting everything will use GROUP BY DIMENSION by default"
      {...rest}
    />
  )
}

export default memo(GroupBy)
