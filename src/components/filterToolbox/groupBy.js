import React, { useCallback, useMemo, memo } from "react"
import { useChart, useAttribute, useAttributeValue } from "@/components/provider"
import { TextBig } from "@netdata/netdata-ui/lib/components/typography"
import DropdownTable from "./dropdownTable"
import { getStats } from "./utils"
import {
  labelColumn,
  uniqueColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
  minColumn,
  avgColumn,
  maxColumn,
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
  minColumn(),
  avgColumn(),
  maxColumn(),
]

const GroupBy = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const groupBy = useAttributeValue("groupBy")
  const groupByLabel = useAttributeValue("groupByLabel")

  let label = "everything"

  const getOptions = useCallback(() => {
    const attributes = chart.getAttributes()

    const defaultOptions = defaultItems.map(item => {
      const selected = groupBy.includes(item.id)

      return getStats(chart, item, {
        key: "group-by",
        childrenKey: "label",
        props: {
          contribution: "-",
          anomalyRate: "-",
          alerts: "-",
          min: "-",
          avg: "-",
          max: "-",
          selected,
        },
        childProps: { unique: "-", disabled: "hidden" },
        children: Object.values(attributes[item.key]),
      })
    })

    return [
      ...defaultOptions,
      ...Object.keys(attributes.labels).map(id =>
        getStats(chart, attributes.labels[id], {
          key: "group-by",
          childrenKey: "label",
          props: { isLabel: true, selected: groupByLabel.includes(id) },
          childProps: { unique: "-", disabled: "hidden" },
          children: attributes.labels[id].vl,
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
      title={
        <TextBig strong whiteSpace="nowrap">
          Group by
        </TextBig>
      }
      label={label}
      data-track={chart.track("group-by")}
      labelProps={labelProps}
      onChange={chart.updateGroupByAttribute}
      getOptions={getOptions}
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
