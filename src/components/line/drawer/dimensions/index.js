import React, { useMemo } from "react"
import { NetdataTable, TextSmall } from "@netdata/netdata-ui"
import { uppercase } from "@/helpers/objectTransform"
import { useDimensionIds, useAttributeValue } from "@/components/provider/selectors"
import { labelColumn, valueColumn, anomalyColumn, minColumn, avgColumn, maxColumn } from "./columns"
import GridItem from "../gridItem"

const useColumns = (period, options = {}) => {
  const hover = useAttributeValue("hoverX")

  return useMemo(() => {
    const columnOptions = { period, ...options }
    const dbOptions = { ...columnOptions, objKey: "sts" }

    return [
      {
        id: "Dimensions",
        header: () => <TextSmall>Dimension ({hover ? "hovering" : "latest"} value)</TextSmall>,
        columns: [labelColumn(), valueColumn()],
      },
      {
        id: "visible",
        header: () => <TextSmall>{uppercase(period)} points</TextSmall>,
        columns: [
          minColumn(columnOptions),
          avgColumn(columnOptions),
          maxColumn(columnOptions),
          anomalyColumn(columnOptions),
        ],
      },
      {
        id: "aggregated",
        header: () => <TextSmall>Aggregated points</TextSmall>,
        columns: [
          minColumn(dbOptions),
          avgColumn(dbOptions),
          maxColumn(dbOptions),
          anomalyColumn(dbOptions),
        ],
      },
    ]
  }, [period, !!hover])
}

const meta = (row, cell, index) => ({
  cellStyles: {
    height: "40px",
    ...(row?.getIsExpanded?.() && { background: "columnHighlight", backgroundOpacity: 0.7 }),
    ...(row.depth > 0 && { backgroundOpacity: 0.4 }),
    ...(row.depth > 0 && index === 0 && { border: { side: "left", size: "4px" } }),
  },
  headStyles: {
    height: "32px",
  },
  styles: { verticalAlign: "middle" },
  bulkActionsStyles: {
    padding: [2, 0],
  },
  searchContainerStyles: {
    width: "100%",
    padding: [0, 2, 0, 2],
  },
  searchStyles: {
    inputContainerStyles: {
      height: "20px",
      border: { side: "all", size: "1px", color: "inputBg" },
      background: "inputBg",
      round: true,
      padding: [1, 2],
      _hover: {
        border: { side: "all", size: "1px", color: "borderSecondary" },
      },
    },
  },
})

const Dimensions = () => {
  const dimensionIds = useDimensionIds()

  const tab = useAttributeValue("weightsTab")
  const columns = useColumns(tab)

  return (
    <GridItem area="table">
      <NetdataTable
        enableSorting
        // enableSelection
        dataColumns={columns}
        data={dimensionIds}
        // onRowSelected={onItemClick}
        // onGlobalSearchChange={noop}
        meta={meta}
        // sortBy={sortBy}
        // rowSelection={rowSelection}
        // onSortingChange={onSortByChange}
        // expanded={expanded}
        // onExpandedChange={onExpandedChange}
        // enableSubRowSelection={enableSubRowSelection}
        width="100%"
        // bulkActions={bulkActions}
        // rowActions={rowActions}
      />
    </GridItem>
  )
}

export default Dimensions
