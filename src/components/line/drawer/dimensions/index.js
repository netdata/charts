import React, { useMemo } from "react"
import styled from "styled-components"
import { NetdataTable, TextSmall } from "@netdata/netdata-ui"
import Legend from "@/components/line/legend"
import DimensionFilter from "@/components/line/dimensionSort"
import Resize from "@/components/line/resize"
import { useDimensionIds, useAttributeValue } from "@/components/provider/selectors"
import Indicators from "@/components/line/indicators"
import { labelColumn, valueColumn, anomalyColumn, minColumn, avgColumn, maxColumn } from "./columns"
import GridItem from "../gridItem"

const useColumns = (options = {}) =>
  useMemo(
    () => [
      {
        id: "Dimension group",
        header: () => <TextSmall>Dimension</TextSmall>,
        columns: [labelColumn(), valueColumn()],
      },
      {
        id: "Visible group",
        header: () => <TextSmall>Visible</TextSmall>,
        columns: [
          minColumn(options),
          avgColumn(options),
          maxColumn(options),
          anomalyColumn(options),
        ],
      },
      {
        id: "DB group",
        header: () => <TextSmall>DB</TextSmall>,
        columns: [
          minColumn({ ...options, objKey: "sts" }),
          avgColumn({ ...options, objKey: "sts" }),
          maxColumn({ ...options, objKey: "sts" }),
          anomalyColumn({ ...options, objKey: "sts" }),
        ],
      },
    ],
    [options.period]
  )

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
  const columns = useColumns({ period: tab })

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
