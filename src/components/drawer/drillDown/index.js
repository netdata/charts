import React, { useMemo } from "react"
import { Flex, Table } from "@netdata/netdata-ui"
import { getStats } from "@/components/filterToolbox/utils"
import { useChart, useAttributeValue } from "@/components/provider/selectors"
import {
  labelColumn,
  metricsColumn,
  contributionColumn,
  anomalyRateColumn,
  alertsColumn,
  minColumn,
  avgColumn,
  maxColumn,
} from "./columns"

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

const columns = [
  labelColumn(),
  metricsColumn(),
  contributionColumn(),
  anomalyRateColumn(),
  alertsColumn(),
  minColumn(),
  avgColumn(),
  maxColumn(),
]

const DrillDown = () => {
  const chart = useChart()

  const nodes = useAttributeValue("nodes")
  const instances = useAttributeValue("instances")
  const dimensions = useAttributeValue("dimensions")

  const selectedNodes = useAttributeValue("selectedNodes")
  const selectedInstances = useAttributeValue("selectedInstances")
  const selectedDimensions = useAttributeValue("selectedDimensions")

  const data = useMemo(
    () =>
      Object.keys(nodes).map(id => {
        const selected = selectedNodes.includes(id)

        return getStats(chart, nodes[id], {
          id,
          key: "nodes",
          childrenKey: "instances",
          props: { selected },
          childProps: {
            isInstance: true,
            getValue: instance => `${instance.id}@${id}`,
            getIsSelected: instance => selectedInstances.includes(`${instance.id}@${id}`),
          },
          children: Object.keys(instances).reduce((h, instanceId) => {
            if (instances[instanceId].ni !== nodes[id].ni) return h

            h.push(instances[instanceId])
            return h
          }, []),
        })
      }),
    [nodes, selectedNodes, selectedInstances]
  )
  debugger

  const tab = useAttributeValue("drawer.tab")

  return (
    <Flex>
      <Table
        enableSorting
        // enableSelection
        dataColumns={columns}
        data={data}
        // onRowSelected={onItemClick}
        // onSearch={noop}
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
    </Flex>
  )
}

export default DrillDown
