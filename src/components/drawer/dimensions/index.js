import React, { useMemo } from "react"
import { Flex, Table, TextSmall, downloadCsvAction } from "@netdata/netdata-ui"
import { uppercase } from "@/helpers/objectTransform"
import { useChart, useDimensionIds, useAttributeValue } from "@/components/provider/selectors"
// import { BarsChart } from "@/components/bars"
import {
  labelColumn,
  valueColumn,
  anomalyColumn,
  minColumn,
  avgColumn,
  maxColumn,
  medianColumn,
  stdDevColumn,
  p95Column,
  rangeColumn,
  volumeColumn,
} from "./columns"

const noop = () => {}

const useColumns = (period, options = {}) => {
  const chart = useChart()
  const hover = useAttributeValue("hoverX")

  return useMemo(() => {
    const columnOptions = { period, ...options }
    const dbOptions = { ...columnOptions, objKey: "dbDimensions", unitsKey: "dbUnits" }

    return [
      {
        id: "Dimensions",
        header: () => <TextSmall>Dimension ({hover ? "hovering" : "latest"} value)</TextSmall>,
        headerString: () => "",
        fullWidth: true,
        columns: [labelColumn(chart), valueColumn(chart)],
      },
      {
        id: "visible",
        header: () => (
          <TextSmall>
            {period === "highlight" ? "Selected area" : uppercase(period)} points
          </TextSmall>
        ),
        headerString: () => "",
        fullWidth: true,
        columns: [
          minColumn(chart, columnOptions),
          avgColumn(chart, columnOptions),
          maxColumn(chart, columnOptions),
          anomalyColumn(chart, columnOptions),
          medianColumn(chart, columnOptions),
          stdDevColumn(chart, columnOptions),
          p95Column(chart, columnOptions),
          rangeColumn(chart, columnOptions),
          volumeColumn(chart, columnOptions),
        ],
      },
      // {
      //   id: "aggregated",
      //   header: () => <TextSmall>Aggregated points</TextSmall>,
      //   fullWidth: true,
      //   columns: [
      //     minColumn(chart, dbOptions),
      //     avgColumn(chart, dbOptions),
      //     maxColumn(chart, dbOptions),
      //     anomalyColumn(chart, dbOptions),
      //   ],
      // },
    ]
  }, [period, !!hover])
}

const meta = (row, cell, index) => ({
  cellStyles: {
    ...(row?.getIsExpanded?.() && { background: "columnHighlight", backgroundOpacity: 0.7 }),
    ...(row.depth > 0 && { backgroundOpacity: 0.4 }),
    ...(row.depth > 0 && index === 0 && { border: { side: "left", size: "4px" } }),
  },
  bulkActionsStyles: {
    padding: [1, 0],
  },
})

const Dimensions = () => {
  const dimensionIds = useDimensionIds()

  const tab = useAttributeValue("drawer.tab")
  const period = tab === "selectedArea" ? "highlight" : "window"
  const columns = useColumns(period)

  const showAdvancedStats = useAttributeValue("drawer.showAdvancedStats", false)

  const chart = useChart()
  useMemo(() => chart.makeChartUI("custom", "bars"), [])

  const columnVisibility = useMemo(
    () => ({
      median: showAdvancedStats,
      stddev: showAdvancedStats,
      p95: showAdvancedStats,
      range: showAdvancedStats,
      volume: showAdvancedStats,
    }),
    [showAdvancedStats]
  )

  const bulkActions = useMemo(() => {
    const filename = `${chart.getAttribute("name") || chart.getAttribute("contextScope").join("-").replace(".", "_")}`

    return {
      download: {
        handleAction: downloadCsvAction(filename),
        tooltipText: "Download as CSV",
        alwaysEnabled: true,
      },
    }
  }, [chart])

  return (
    <Flex gap={2}>
      <Table
        key={period}
        enableSorting
        enableColumnVisibility
        columnVisibility={columnVisibility}
        // enableSelection
        dataColumns={columns}
        data={dimensionIds}
        // onRowSelected={onItemClick}
        onSearch={noop}
        meta={meta}
        // sortBy={sortBy}
        // rowSelection={rowSelection}
        // onSortingChange={onSortByChange}
        // expanded={expanded}
        // onExpandedChange={onExpandedChange}
        // enableSubRowSelection={enableSubRowSelection}
        width="100%"
        bulkActions={bulkActions}
        // rowActions={rowActions}
      />
      {/*      <Flex flex={false} width={{base: "30%", min: }}>
        <BarsChart chart={chart} uiName="custom" />
      </Flex>*/}
    </Flex>
  )
}

export default Dimensions
