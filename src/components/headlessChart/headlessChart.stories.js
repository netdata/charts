import React from "react"
import { Flex, Text, Table } from "@netdata/netdata-ui"
import HeadlessChart from "./index"
import useHeadlessChart from "./useHeadlessChart"
import makeDefaultSDK from "../../makeDefaultSDK"

const CustomTable = () => {
  const { data, currentRow, dimensionIds, helpers, state } = useHeadlessChart()

  const columns = [
    {
      id: "timestamp",
      header: "Timestamp",
      accessorFn: row => row.formattedTime,
      cell: ({ row }) => (
        <Text
          color={row.original.isCurrentRow ? "primary" : "text"}
          weight={row.original.isCurrentRow ? "bold" : "normal"}
        >
          {row.original.formattedDate} {row.original.formattedTime}
        </Text>
      ),
    },
    ...dimensionIds.map(dimensionId => ({
      id: dimensionId,
      header: dimensionId,
      accessorFn: row => {
        const dimension = row.dimensions.find(d => d.id === dimensionId)
        return dimension?.convertedValue || "-"
      },
      cell: ({ row }) => {
        const dimension = row.original.dimensions.find(d => d.id === dimensionId)
        if (!dimension) return <Text>-</Text>

        return (
          <Flex alignItems="center" gap={1}>
            <div
              style={{
                width: 8,
                height: 8,
                backgroundColor: dimension.color,
                borderRadius: 2,
              }}
            />
            <Text
              color={row.original.isCurrentRow ? "primary" : "text"}
              weight={row.original.isCurrentRow ? "bold" : "normal"}
            >
              {dimension.convertedValue}
            </Text>
          </Flex>
        )
      },
    })),
  ]

  const handleRowHover = row => {
    if (row?.original?.timestamp) {
      helpers.updateAttribute("hoverX", [row.original.timestamp, 0])
    }
  }

  const handleRowBlur = () => {
    helpers.updateAttribute("hoverX", null)
  }

  if (state.empty) {
    return (
      <Flex padding={[4]} justifyContent="center">
        <Text>No data available</Text>
      </Flex>
    )
  }

  return (
    <Flex column gap={2}>
      <Flex justifyContent="space-between" alignItems="center">
        <Text variant="h6">Custom Table with HeadlessChart</Text>
        <Text variant="caption" color="textSecondary">
          Rows: {data.length} | Dimensions: {dimensionIds.length}
        </Text>
        {state.loading && <Text>Loading chart data...</Text>}
      </Flex>

      {currentRow && (
        <Flex gap={2} padding={[2]} background="backgroundSecondary" borderRadius={1}>
          <Text weight="bold">Current Row:</Text>
          <Text>{currentRow.formattedTimestamp}</Text>
          {currentRow.dimensions.map(dim => (
            <Flex key={dim.id} alignItems="center" gap={1}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: dim.color,
                  borderRadius: 1,
                }}
              />
              <Text>
                {dim.id}: {dim.convertedValue}
              </Text>
            </Flex>
          ))}
        </Flex>
      )}

      <Table
        data={data}
        dataColumns={columns}
        onRowHover={handleRowHover}
        onRowBlur={handleRowBlur}
        enableSorting
        maxHeight="400px"
        enableRowSelection={false}
      />
    </Flex>
  )
}

export const HeadlessChartStory = ({ host, contextScope, nodesScope, ...args }) => {
  const sdk = makeDefaultSDK({ attributes: { theme: "default", containerWidth: 1000 } })

  return (
    <Flex background="mainBackground" padding={[4]} height="100vh">
      <HeadlessChart
        sdk={sdk}
        contextScope={[contextScope]}
        nodesScope={[nodesScope]}
        host={host}
        agent={true}
        syncHover={true}
        aggregationMethod="avg"
        groupingMethod="average"
        {...args}
      >
        <CustomTable />
      </HeadlessChart>
    </Flex>
  )
}

export const HeadlessChartRenderProp = ({ host, contextScope, nodesScope, ...args }) => {
  const sdk = makeDefaultSDK({ attributes: { theme: "default", containerWidth: 1000 } })

  return (
    <Flex background="mainBackground" padding={[4]} height="100vh">
      <HeadlessChart
        sdk={sdk}
        contextScope={[contextScope]}
        nodesScope={[nodesScope]}
        host={host}
        agent={true}
        syncHover={true}
        aggregationMethod="avg"
        groupingMethod="average"
        {...args}
      >
        {({ data, state, helpers }) => (
          <Flex column gap={2}>
            <Text variant="h6">Render Prop Pattern</Text>

            {state.loading && <Text>Loading...</Text>}
            {state.empty && <Text>No data</Text>}

            {data && data.length > 0 && (
              <Flex column gap={1}>
                <Text weight="bold">Latest Data Point ({data.length} total points):</Text>
                <Text>{helpers.formatTime(data[data.length - 1][0])}</Text>
                <Flex gap={2}>
                  {helpers.getVisibleDimensionIds().map(dimensionId => {
                    const value = helpers.getDimensionValue(dimensionId, data.length - 1)
                    const color = helpers.selectDimensionColor(dimensionId)

                    return (
                      <Flex key={dimensionId} alignItems="center" gap={1}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: color,
                            borderRadius: 2,
                          }}
                        />
                        <Text>
                          {dimensionId}: {value}
                        </Text>
                      </Flex>
                    )
                  })}
                </Flex>
              </Flex>
            )}
          </Flex>
        )}
      </HeadlessChart>
    </Flex>
  )
}

export default {
  title: "HeadlessChart",
  component: HeadlessChartStory,
  tags: ["autodocs"],
  args: {
    host: "http://10.10.11.51:19999/api/v3",
    contextScope: "system.load",
    nodesScope: "*",
  },
  argTypes: {
    host: {
      control: { type: "text" },
      description: "API endpoint for data fetching",
    },
    contextScope: {
      control: { type: "text" },
      description: "Chart context scope",
    },
    nodesScope: {
      control: { type: "text" },
      description: "Nodes scope for data filtering",
    },
  },
}
