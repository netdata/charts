import React, { useMemo } from "react"
import { Table } from "@netdata/netdata-ui"
import useHover from "@/components/useHover"
import ChartContainer from "@/components/chartContainer"
import useDebouncedValue from "@netdata/netdata-ui/dist/hooks/useDebouncedValue"
import { useChart, useAttributeValue } from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import Toolbox from "@/components/toolbox"
import useTableMatrix from "./useTableMatrix"
import useTableColumns from "./useTableColumns"

const Dimensions = () => {
  const chart = useChart()
  const tab = useAttributeValue("drawer.tab")
  const { tableSortBy } = chart.getAttributes()

  const { rowGroups, contextGroups, labels, data, groups, dimensionIds } = useTableMatrix()

  const columns = useTableColumns({
    period: tab,
    groups,
    dimensionIds,
    labels,
    rowGroups,
    contextGroups,
  })

  const sortBy = useMemo(() => {
    if (!tableSortBy || tableSortBy.length > 1 || !contextGroups) return tableSortBy

    const [first] = tableSortBy
    if (!first || !contextGroups[first.id] || !Object.keys(contextGroups[first.id]))
      return tableSortBy

    return Object.keys(contextGroups[first.id]).map(id => ({
      id: `value${first.id}${id}`,
      desc: first.desc,
    }))
  }, [tableSortBy, contextGroups])

  const hoverRef = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node ||
        (!node.closest(`[data-toolbox="${chart.getId()}"]`) &&
          !node.closest(`[data-chartid="${chart.getId()}"]`)),
    },
    [chart]
  )

  const debouncedData = useDebouncedValue(data, 300)

  return (
    <Table
      ref={hoverRef}
      enableSorting
      enableColumnVisibility
      dataColumns={columns}
      data={debouncedData || data}
      enableCustomSearch
      // onRowSelected={onItemClick}
      // onSearch={noop}
      // meta={meta}
      sortBy={sortBy}
      // rowSelection={rowSelection}
      // onSortingChange={onSortByChange}
      // expanded={expanded}
      // onExpandedChange={onExpandedChange}
      // enableSubRowSelection={enableSubRowSelection}
      width="100%"
      onSearch={q => chart.updateAttribute("searchQuery", q)}
      // bulkActions={bulkActions}
      // rowActions={rowActions}
      headerChildren={<Toolbox />}
    />
  )
}

export const TableChart = ({ uiName, ref, ...rest }) => (
  <ChartWrapper ref={ref}>
    <ChartContainer
      uiName={uiName}
      column
      alignItems="center"
      justifyContent="center"
      position="relative"
      {...rest}
    >
      <Dimensions />
    </ChartContainer>
  </ChartWrapper>
)

export default withChart(TableChart)
