import { useMemo, memo } from "react"
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
        expandKey: "instance",
      },
      { nm: "dimension", id: "dimension", key: "dimensions" },
      {
        nm: `percentage of ${chart.intl("instance")}`,
        id: "percentage-of-instance",
        key: "instances",
        expandKey: "instance",
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
  rangeColumn(),
]

const GroupBy = ({ labelProps, ...rest }) => {
  const chart = useChart()
  const groupBy = useAttributeValue("postGroupBy")
  const groupByLabel = useAttributeValue("postGroupByLabel")

  let label = "everything"

  const loadInstanceLabels = useInstanceLabels()
  const defaultItems = useDefaultItems(chart)

  const getOptions = useGroupByOptions(chart, { defaultItems, groupBy, groupByLabel })

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
      onOpen={loadInstanceLabels}
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
