import React, { useMemo } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
// todo:
// import { ChartTimeframe } from "domains/chart/components/chart-legend-bottom"
import GroupBoxes from "@/components/group-box-chart/groupBoxes"
import Legend from "@/components/group-box-chart/legend"
import withChart from "@/components/hocs/withChart"
import getLabel from "./getLabel"
import transform from "./transform"
import Popover from "./popover"
import { useChart, usePayload } from "@/components/provider"

const KubernetesGroupBoxes = (
  {
    // chartData,
    // chartMetadata,
    // attributes,
    // viewAfter,
    // viewBefore,
    // hoveredRow,
    // hoveredX,
    // showUndefined,
  }
) => {
  const chart = useChart()
  const chartData = usePayload()

  const { filteredRows } = null //attributes
  const { data: groupBoxData, labels, chartLabels } = useMemo(
    () => transform(chart, filteredRows),
    [filteredRows, chartData]
  )

  const {
    id,
    result: { data },
    groupBy,
    postGroupBy,
  } = chartData

  // const renderBoxPopover = ({ groupIndex, index, align }) => {
  //   const label = groupBoxData[groupIndex].labels[index]
  //   const { title } = getLabel(postGroupBy)

  //   return (
  //     <Popover
  //       align={align}
  //       title={`${title}: ${label}`}
  //       groupLabel={labels[groupIndex]}
  //       postGroupLabel={label}
  //       chartLabels={groupBoxData[groupIndex].chartLabels[index]}
  //       attributes={attributes}
  //       viewBefore={viewBefore}
  //       viewAfter={viewAfter}
  //     />
  //   )
  // }

  // const renderGroupPopover = ({ groupIndex, align }) => {
  //   const label = labels[groupIndex]
  //   const { title } = getLabel(groupBy)

  //   return (
  //     <Popover
  //       align={align}
  //       title={`${title}: ${label}`}
  //       groupLabel={label}
  //       chartLabels={chartLabels[groupIndex]}
  //       attributes={attributes}
  //       viewBefore={viewBefore}
  //       viewAfter={viewAfter}
  //     />
  //   )
  // }

  const groupedBoxesData = useMemo(() => {
    return groupBoxData.map(groupedBox => {
      return {
        labels: groupedBox.labels,
        data: groupedBox.postAggregated,
        // hoveredRow === -1 || hoveredRow > data.length || !(hoveredRow in data)
        //   ? groupedBox.postAggregated
        //   : groupedBox.indexes.map(index => data[hoveredRow][index + 1]) || [],
      }
    })
  }, [data, groupBoxData])

  return (
    <Flex column width="100%" height="100%" gap={4} padding={[4, 2]}>
      <GroupBoxes
        data={groupedBoxesData}
        labels={labels}
        // renderBoxPopover={renderBoxPopover}
        // renderGroupPopover={renderGroupPopover}
      />
      <Flex data-testid="legend-container" justifyContent="between">
        <Legend>{id}</Legend>
        {/* <ChartTimeframe
          chartMetadata={chartMetadata}
          showUndefined={showUndefined}
          hoveredX={hoveredX}
          viewBefore={viewBefore}
          chartData={chartData}
        /> */}
      </Flex>
    </Flex>
  )
}

export default KubernetesGroupBoxes
