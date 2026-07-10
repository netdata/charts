import React, { useCallback, useLayoutEffect, useMemo, useRef } from "react"
import { Flex, Table, Text, TextBig } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider/selectors"
import useData from "./useData"
import updateDrilldownGroupBy from "./updateGroupBy"
import GroupBy from "@/components/filterToolbox/groupBy"
import { flattenTree, matchesSearch, normalizeSearch } from "@/components/drawer/search"
import {
  labelColumn,
  contributionColumn,
  anomalyRateColumn,
  minColumn,
  avgColumn,
  maxColumn,
} from "./columns"

const noop = () => {}
const getRowId = row => row.id

const meta = (row, cell, index) => ({
  cellStyles: {
    ...(row?.getIsExpanded?.() && { background: "columnHighlight", backgroundOpacity: 0.7 }),
    ...((row.original?.searchDepth ?? row.depth) > 0 && { backgroundOpacity: 0.4 }),
    ...((row.original?.searchDepth ?? row.depth) > 0 &&
      index === 0 && { border: { side: "left", size: "4px" } }),
  },
  bulkActionsStyles: {
    padding: [1, 0],
  },
})

const DrillDown = () => {
  const chart = useChart()
  const { hierarchicalData, loading, error, groupedBy } = useData()

  const expanded = useAttributeValue("drilldown.expanded", {})
  const sortBy = useAttributeValue("drilldown.sortBy", [])
  const search = useAttributeValue("drilldown.search", "")
  const tableRef = useRef(null)
  const containerRef = useRef(null)
  const restoreSearchFocusRef = useRef(false)

  const columns = useMemo(
    () => [
      labelColumn(groupedBy),
      contributionColumn(),
      anomalyRateColumn(),
      minColumn(),
      avgColumn(),
      maxColumn(),
    ],
    [groupedBy]
  )

  const onExpandedChange = useCallback(
    expandedState => chart.updateAttribute("drilldown.expanded", expandedState),
    [chart]
  )

  const onSortByChange = useCallback(
    sortState => chart.updateAttribute("drilldown.sortBy", sortState),
    [chart]
  )
  const onSearch = useCallback(
    query => {
      restoreSearchFocusRef.current =
        containerRef.current?.querySelector('[data-testid="table-global-search-filter"]') ===
        document.activeElement
      chart.updateAttribute("drilldown.search", query)
    },
    [chart]
  )
  const searching = Boolean(normalizeSearch(search))
  const searchableData = useMemo(() => flattenTree(hierarchicalData), [hierarchicalData])
  const displayData = useMemo(
    () =>
      searching
        ? searchableData.filter(row => matchesSearch([row.label], search))
        : hierarchicalData,
    [hierarchicalData, search, searchableData, searching]
  )
  const getItemKey = useCallback(
    index => tableRef.current?.getRowModel().rows[index]?.id || displayData[index]?.id || index,
    [displayData]
  )
  const virtualizeOptions = useMemo(() => ({ overscan: 1, getItemKey }), [getItemKey])

  useLayoutEffect(() => {
    if (!restoreSearchFocusRef.current) return

    const input = containerRef.current?.querySelector(
      '[data-testid="table-global-search-filter"]'
    )
    input?.focus()
    input?.setSelectionRange(input.value.length, input.value.length)
    restoreSearchFocusRef.current = false
  }, [displayData.length, searching])

  if (error) {
    return (
      <Flex padding={[3]} justifyContent="center" color="text">
        Error loading drilldown data: {error}
      </Flex>
    )
  }

  if (!loading && (!hierarchicalData || hierarchicalData.length === 0)) {
    return (
      <Flex padding={[3]} justifyContent="center" alignItems="center" column gap={2}>
        <TextBig color="textLite">
          No data available for the selected time range
        </TextBig>
        <Text color="textLite">
          Try adjusting the time range or chart settings
        </Text>
      </Flex>
    )
  }

  return (
    <Flex
      flex
      column
      height={{ min: "0px", base: "100%" }}
      overflow="hidden"
      data-testid="chart-drilldown-table-container"
      ref={containerRef}
    >
      <Table
        key={searching ? `search-${displayData.length}` : "browse"}
        enableSorting
        enableCustomSearch
        dataColumns={columns}
        data={displayData}
        meta={meta}
        sortBy={sortBy}
        globalFilter={search}
        onSearch={onSearch}
        onSortingChange={onSortByChange}
        expanded={searching ? {} : expanded}
        onExpandedChange={searching ? noop : onExpandedChange}
        getRowId={getRowId}
        virtualizeOptions={virtualizeOptions}
        tableRef={tableRef}
        width="100%"
        headerChildren={
          <GroupBy
            groupByKey="drilldown.groupBy"
            groupByLabelKey="drilldown.groupByLabel"
            sortByKey="drilldown.groupBySortBy"
            expandedKey="drilldown.groupByExpanded"
            onChange={selected => updateDrilldownGroupBy(chart, selected)}
            trackingId="drilldown-group-by"
            emptyMessage="Deselecting everything will use GROUP BY NODE, INSTANCE, DIMENSION by default"
          />
        }
      />
    </Flex>
  )
}

export default DrillDown
