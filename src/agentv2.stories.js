import React from "react"
import { Flex } from "@netdata/netdata-ui"
import Line from "@/components/line"
import GaugeComponent from "@/components/gauge"
import EasyPieComponent from "@/components/easyPie"
import NumberComponent from "@/components/number"
import D3pieComponent from "@/components/d3pie"
import BarsComponent from "@/components/bars"
import GroupBoxes from "@/components/groupBoxes"
import Table from "@/components/table"
import makeDefaultSDK from "./makeDefaultSDK"

export const Chart = ({ nodesScope, contextScope, contexts, host, theme, singleDimension }) => {
  const sdk = makeDefaultSDK({ attributes: { theme, containerWidth: 1000 } })
  const chart = sdk.makeChart({
    attributes: {
      id: "control",
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: ["system.load"],
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
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
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
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
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
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
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
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
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
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
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
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
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
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
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
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
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
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
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
      <Line chart={chart} height="315px" width="100%" />
      {/*<Table chart={chart7} height="315px" width="100%" />*/}
      {/*<GroupBoxes chart={chart4} />*/}
    </Flex>
  )
}

export default {
  title: "Agent V2",
  component: Chart,
  tags: ["autodocs"],
  args: {
    nodesScope: "*",
    contextScope: "system.load",
    contexts: "*",
    singleDimension: "*",
    theme: "default",
    host: "http://10.10.11.51:19999/api/v3",
  },
  argTypes: {
    host: {
      control: { type: "text" },
    },
    nodesScope: {
      control: { type: "text" },
    },
    contextScope: {
      control: { type: "text" },
    },
    contexts: {
      control: { type: "text" },
    },
    // singleDimension: {
    //   control: { type: "text" },
    // },
    theme: {
      control: { type: "select" },
      options: ["default", "dark"],
    },
  },
}
