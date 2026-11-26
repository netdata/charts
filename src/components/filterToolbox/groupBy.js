import { useCallback, useMemo, memo } from "react"
import { useChart, useAttribute, useAttributeValue } from "@/components/provider"
import { TextBig } from "@netdata/netdata-ui"
import useInstanceLabels from "@/components/instanceIdentity/useInstanceLabels"
import DropdownTable from "./dropdownTable"
import useGroupByOptions from "./useGroupByOptions"
import {
  labelColumn,
  uniqueColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
  minColumn,
  avgColumn,
  maxColumn,
  rangeColumn,
} from "./columns"

const useDefaultItems = (chart, { groupByKey, contextScope, showPostAggregations }) =>
  useMemo(() => {
    const hasMultipleContexts = contextScope.length > 1
    return [
      { nm: "node", id: "node", key: "nodes" },
      {
        nm: `${chart.intl("instance")} ${
          chart.intl("instance") === "instance" ? "" : "(instance)"
        }`,
        id: "instance",
        key: "instances",
        expandKey: "instance",
      },
      { nm: "dimension", id: "dimension", key: "dimensions" },
      (showPostAggregations || "drilldown.groupBy" === groupByKey) && {
        nm: `percentage of ${chart.intl("instance")}`,
        id: "percentage-of-instance",
        key: "instances",
        expandKey: "instance",
      },
      hasMultipleContexts && { nm: "context", id: "context", key: "contexts" },
    ].filter(Boolean)
  }, [groupByKey, contextScope])

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
  rangeColumn(),
]

const GroupBy = ({
  groupByKey = "groupBy",
  groupByLabelKey = "groupByLabel",
  sortByKey = "groupBySortBy",
  expandedKey = "groupByExpanded",
  onChange,
  trackingId = "group-by",
  emptyMessage = "Deselecting everything will use GROUP BY DIMENSION by default",
  labelProps,
  ...rest
}) => {
  const chart = useChart()
  const groupBy = useAttributeValue(groupByKey)
  const groupByLabel = useAttributeValue(groupByLabelKey)
  const contextScope = useAttributeValue("contextScope")
  const showPostAggregations = useAttributeValue("showPostAggregations")

  let label = "everything"

  const loadInstanceLabels = useInstanceLabels()
  const defaultItems = useDefaultItems(chart, { groupByKey, contextScope, showPostAggregations })

  const getOptions = useGroupByOptions(chart, { defaultItems, groupBy, groupByLabel })

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

  const [sortBy, onSortByChange] = useAttribute(sortByKey)
  const [expanded, onExpandedChange] = useAttribute(expandedKey)

  const defaultOnChange = useCallback(selected => chart.updateGroupByAttribute(selected), [chart])

  return (
    <DropdownTable
      title={
        <TextBig strong whiteSpace="nowrap">
          Group by
        </TextBig>
      }
      label={label}
      data-track={chart.track(trackingId)}
      labelProps={labelProps}
      onChange={onChange || defaultOnChange}
      getOptions={getOptions}
      onOpen={loadInstanceLabels}
      secondaryLabel="Group by"
      tooltipProps={tooltipProps}
      value={value}
      columns={columns}
      enableSubRowSelection={false}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      emptyMessage={emptyMessage}
      {...rest}
    />
  )
}

export default memo(GroupBy)
