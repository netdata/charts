import React from "react"
import { Flex } from "@netdata/netdata-ui"
import Line from "@/components/line"
import HeadlessChart from "@/components/headlessChart"
import makeDefaultSDK from "./makeDefaultSDK"

export const Chart = ({ contextScope, selectedContexts, host, theme }) => {
  const sdk = makeDefaultSDK({ attributes: { theme, containerWidth: 1000 } })
  const chart = sdk.makeChart({
    attributes: {
      id: "control",
      selectedContexts,
      contextScope,
      host: host,
      aggregationMethod: "sum",
      agent: true,
      syncHover: true,
      groupingMethod: "average",
    },
  })

  sdk.appendChild(chart)

  const chart7 = sdk.makeChart({
    attributes: {
      id: "control",
      selectedContexts,
      contextScope: ["disk.io", "disk.ops", "disk.await", "disk.util"],
      host: host,
      aggregationMethod: "avg",
      agent: true,
      syncHover: true,
      groupingMethod: "average",
      chartLibrary: "table",
      groupBy: ["label", "dimension", "context", "node"],
      groupByLabel: ["device"],
      en: {
        "disk.io": {
          one: "DISK IO",
        },
      },
    },
  })

  sdk.appendChild(chart7)

  const chart2 = sdk.makeChart({
    attributes: {
      selectedContexts,
      contextScope,
      selectedDimensions: ["in"],
      host: host,
      agent: true,
      chartLibrary: "easypiechart",
      urlOptions: ["percentage"],
      groupBy: ["percentage-of-instance"],
      syncHover: true,
      width: "50%",
    },
  })

  sdk.appendChild(chart2)

  const chart3 = sdk.makeChart({
    attributes: {
      selectedContexts,
      contextScope,
      selectedDimensions: ["out"],
      host: host,
      agent: true,
      chartLibrary: "gauge",
      syncHover: true,
      urlOptions: ["percentage"],
      width: "50%",
    },
  })

  sdk.appendChild(chart3)

  const chart4 = sdk.makeChart({
    attributes: {
      selectedContexts,
      contextScope,
      host: host,
      agent: true,
      chartLibrary: "groupBoxes",
      groupBy: ["dimension", "node"],
      width: "50%",
    },
  })
  sdk.appendChild(chart4)

  const chart5 = sdk.makeChart({
    attributes: {
      selectedContexts,
      contextScope,
      host: host,
      agent: true,
      chartLibrary: "number",
      syncHover: true,
      width: "50%",
    },
  })

  sdk.appendChild(chart5)

  const chart6 = sdk.makeChart({
    attributes: {
      selectedContexts,
      contextScope,
      host: host,
      aggregationMethod: "avg",
      agent: true,
      syncHover: true,
      groupingMethod: "average",
      chartLibrary: "d3pie",
      width: "50%",
    },
  })

  sdk.appendChild(chart6)

  const chart8 = sdk.makeChart({
    attributes: {
      selectedContexts,
      contextScope,
      host: host,
      aggregationMethod: "avg",
      agent: true,
      syncHover: true,
      groupingMethod: "average",
      chartLibrary: "d3pie",
      width: "50%",
    },
  })

  sdk.appendChild(chart8)

  const chart9 = sdk.makeChart({
    attributes: {
      selectedContexts,
      contextScope,
      host: host,
      aggregationMethod: "avg",
      agent: true,
      syncHover: true,
      groupingMethod: "average",
      chartLibrary: "d3pie",
      width: "50%",
    },
  })

  sdk.appendChild(chart9)

  const chart10 = sdk.makeChart({
    attributes: {
      selectedContexts,
      contextScope,
      host: host,
      agent: true,
      chartLibrary: "bars",
      syncHover: true,
      width: "50%",
    },
  })

  sdk.appendChild(chart10)

  return (
    <Flex background="mainBackground" column gap={2} padding={[3]} overflow="auto" height="100%">
      {/*<Flex height={50} width="100%" gap={2}>
        <EasyPieComponent chart={chart2} height="100px" width="100px" />
        <GaugeComponent chart={chart3} height="100px" width="100px" />
        <NumberComponent chart={chart5} height="100px" width="100px" />
        <D3pieComponent chart={chart6} height="100px" width="100px" />
      </Flex>
      <Flex height={50} width="100%" gap={2}>
        <D3pieComponent chart={chart8} height="100px" width="100px" />
        <D3pieComponent chart={chart9} height="100px" width="100px" />
        <BarsComponent chart={chart10} height="100px" width="100px" />
      </Flex>*/}
      <Line chart={chart} height="600px" width="100%" />
      {/*<Table chart={chart7} height="315px" width="100%" />*/}
      {/*<GroupBoxes chart={chart4} />*/}
    </Flex>
  )
}

export const HeadlessChartExample = ({
  nodesScope,
  contextScope,
  selectedContexts,
  host,
  theme,
}) => {
  const sdk = makeDefaultSDK({ attributes: { theme, containerWidth: 1000 } })

  const chart = sdk.makeChart({
    attributes: {
      id: "control",
      selectedContexts,
      contextScope,
      host: host,
      aggregationMethod: "sum",
      agent: true,
      syncHover: true,
      groupingMethod: "average",
    },
  })

  sdk.appendChild(chart)

  return (
    <Flex background="mainBackground" column gap={2} padding={[3]} overflow="auto" height="100%">
      <Line chart={chart} height="600px" width="100%" />
      <HeadlessChart
        sdk={sdk}
        contextScope={[contextScope]}
        nodesScope={[nodesScope]}
        host={host}
        agent={true}
        syncHover={true}
        aggregationMethod="avg"
        groupingMethod="average"
      >
        {({ data, state, helpers, currentRow }) => (
          <Flex column gap={2}>
            <h3>HeadlessChart Example</h3>

            {state.loading && <div>Loading chart data...</div>}
            {state.empty && <div>No data available</div>}

            {data && data.length > 0 && (
              <Flex column gap={1}>
                <div>
                  <strong>Latest Data Point ({data.length} total points):</strong>
                </div>
                <div>{helpers.formatTime(data[data.length - 1][0])}</div>
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
                        <span>
                          {dimensionId}: {value}
                        </span>
                      </Flex>
                    )
                  })}
                </Flex>

                <div>
                  <strong>Hovered Data Point:</strong>
                </div>
                <div>{currentRow.formattedTime}</div>
                <Flex gap={2}>
                  {currentRow.dimensions.map(dim => {
                    return (
                      <Flex key={dim.id} alignItems="center" gap={1}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            backgroundColor: dim.color,
                            borderRadius: 2,
                          }}
                        />
                        <span>
                          {dim.id}: {dim.convertedValue}
                        </span>
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
  title: "Agent V2",
  component: Chart,
  tags: ["autodocs"],
  args: {
    nodesScope: [],
    contextScope: ["system.load"],
    selectedContexts: [],
    selectedDimensions: [],
    theme: "default",
    host: "http://10.10.11.51:19999/api/v3",
  },
  argTypes: {
    host: {
      control: { type: "text" },
    },
    contextScope: {
      control: { type: "multi-select" },
      options: ["system.load"],
    },
    selectedContexts: {
      control: { type: "multi-select" },
      options: ["system.load"],
    },
    selectedDimensions: {
      control: { type: "multi-select" },
      options: ["in", "out"],
    },
    theme: {
      control: { type: "select" },
      options: ["default", "dark"],
    },
  },
}
