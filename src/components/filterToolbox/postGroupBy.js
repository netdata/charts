import React, { useCallback, useMemo, memo } from "react"
import { useChart, useAttribute, useAttributeValue } from "@/components/provider"
import { TextBig } from "@netdata/netdata-ui"
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

const useDefaultItems = chart =>
  useMemo(
    () => [
      { nm: "node", id: "node", key: "nodes" },
      {
        nm: `${chart.intl("instance")} ${
          chart.intl("instance") === "instance" ? "" : "(instance)"
        }`,
        id: "instance",
        key: "instances",
      },
      { nm: "dimension", id: "dimension", key: "dimensions" },
      {
        nm: `percentage of ${chart.intl("instance")}`,
        id: "percentage-of-instance",
        key: "instances",
      },
      {
        nm: "as single value",
        id: "selected",
      },
    ],
    []
  )

const tooltipProps = {
  heading: "Post group by",
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
  const groupBy = useAttributeValue("postGroupBy")
  const groupByLabel = useAttributeValue("postGroupByLabel")

  let label = "everything"

  const defaultItems = useDefaultItems(chart)

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
        children: attributes[item.key] ? Object.values(attributes[item.key]) : [],
      })
    })

    return [
      ...defaultOptions,
      ...Object.keys(attributes.labels).map(id =>
        getStats(chart, attributes.labels[id], {
          key: "group-by",
          childrenKey: "label",
          props: {
            getLabel: obj => `label: ${obj.nm || id || obj.id}`,
            isLabel: true,
            selected: groupByLabel.includes(id),
          },
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

    return groups.join(", ") || "-"
  }, [groupBy, groupByLabel])

  const value = useMemo(() => [...groupBy, ...groupByLabel], [groupBy, groupByLabel])

  const [sortBy, onSortByChange] = useAttribute("groupBySortBy")
  const [expanded, onExpandedChange] = useAttribute("groupByExpanded")

  return (
    <DropdownTable
      title={
        <TextBig strong whiteSpace="nowrap">
          Post group by
        </TextBig>
      }
      label={label}
      data-track={chart.track("post-group-by")}
      labelProps={labelProps}
      onChange={chart.updatePostGroupByAttribute}
      getOptions={getOptions}
      secondaryLabel="Post group by"
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      enableSubRowSelection={false}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      {...rest}
    />
  )
}

export default memo(GroupBy)
