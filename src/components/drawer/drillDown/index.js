import React from "react"
import { Flex, Table } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider/selectors"
import { useDrilldownData } from "./useDrilldownData"
import updateDrilldownGroupBy from "./updateDrilldownGroupBy"
import {
  labelColumn,
  contributionColumn,
  anomalyRateColumn,
  minColumn,
  avgColumn,
  maxColumn,
} from "./columns"

const noop = () => {}

const meta = (row, cell, index) => ({
  cellStyles: {
    height: "40px",
    ...(row?.getIsExpanded?.() && { background: "columnHighlight", backgroundOpacity: 0.7 }),
    ...(row.depth > 0 && { backgroundOpacity: 0.4 }),
    ...(row.depth > 0 && index === 0 && { border: { side: "left", size: "4px" } }),
  },
  bulkActionsStyles: {
    padding: [1, 0],
  },
})

const DrillDown = () => {
  const chart = useChart()
  const { hierarchicalData, loading, error } = useDrilldownData()
  const groupBy = useAttributeValue("drilldown.groupBy", ["node", "instance", "dimension"])
  const expanded = useAttributeValue("drilldown.expanded", {})
  const sortBy = useAttributeValue("drilldown.sortBy", [])

  const columns = [
    labelColumn(groupBy),
    contributionColumn(),
    anomalyRateColumn(),
    minColumn(),
    avgColumn(),
    maxColumn(),
  ]

  const onGroupByChange = selected => {
    updateDrilldownGroupBy(chart, selected)
  }

  const onExpandedChange = expandedState => {
    chart.updateAttribute("drilldown.expanded", expandedState)
  }

  const onSortByChange = sortState => {
    chart.updateAttribute("drilldown.sortBy", sortState)
  }

  if (error) {
    return (
      <Flex padding={[3]} justifyContent="center" color="text">
        Error loading drilldown data: {error.message}
      </Flex>
    )
  }

  return (
    <Flex>
      <Table
        enableSorting
        enableExpanding
        dataColumns={columns}
        data={hierarchicalData}
        meta={meta}
        sortBy={sortBy}
        onSearch={noop}
        onSortingChange={onSortByChange}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
        loading={loading}
        width="100%"
        headerChildren={<div>Group by controls will go here</div>}
      />
    </Flex>
  )
}

export default DrillDown
