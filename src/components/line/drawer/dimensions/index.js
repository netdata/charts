import React from "react"
import styled from "styled-components"
import { Flex, NetdataTable, getColor } from "@netdata/netdata-ui"
import Legend from "@/components/line/legend"
import DimensionFilter from "@/components/line/dimensionSort"
import Resize from "@/components/line/resize"
import { useDimensionIds, useAttributeValue } from "@/components/provider/selectors"
import Indicators from "@/components/line/indicators"
import {
  labelColumn,
  valueColumn,
  anomalyColumn,
  annotationsColumn,
  minColumn,
  maxColumn,
} from "./columns"
import GridItem from "../gridItem"

const columns = [
  labelColumn(),
  valueColumn(),
  minColumn(),
  maxColumn(),
  anomalyColumn(),
  annotationsColumn(),
]

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

const Drawer = () => {
  const dimensionIds = useDimensionIds()

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

export default Drawer
