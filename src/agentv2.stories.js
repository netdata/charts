import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/lib/theme"
import { Flex, Text } from "@netdata/netdata-ui"
import Line from "@/components/line"
import GaugeComponent from "@/components/gauge"
import EasyPieComponent from "@/components/easyPie"
import GroupBoxes from "@/components/groupBoxes"
import makeDefaultSDK from "./makeDefaultSDK"

const Popover = ({ children }) => (
  <Flex background="elementBackground" padding={[4]} round border>
    <Text>{children}</Text>
  </Flex>
)

const renderBoxPopover = () => <Popover>Box Popover</Popover>
const renderGroupPopover = () => <Popover>Group Popover</Popover>

const Template = ({ nodesScope, contextScope, contexts, host, theme, singleDimension }) => {
  const sdk = makeDefaultSDK({ attributes: { theme } })
  const chart = sdk.makeChart({
    attributes: {
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
      host: host,
      aggregationMethod: "avg",
      agent: true,
      syncHover: true,
      groupingMethod: "average",
    },
  })

  sdk.appendChild(chart)

  const chart2 = sdk.makeChart({
    attributes: {
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
      // selectedDimensions: [singleDimension],
      host: host,
      agent: true,
      chartLibrary: "gauge",
      chartUrlOptions: ["percentage"],
      syncHover: true,
    },
  })

  sdk.appendChild(chart2)

  const chart3 = sdk.makeChart({
    attributes: {
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
      // selectedDimensions: [singleDimension],
      host: host,
      agent: true,
      chartLibrary: "easypiechart",
      syncHover: true,
      chartUrlOptions: ["percentage"],
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
      groupBy: ["label"],
      groupByLabel: ["k8s_namespace", "k8s_container_id"],
    },
  })
  sdk.appendChild(chart4)

  return (
    <ThemeProvider theme={theme === "default" ? DefaultTheme : DarkTheme}>
      <Flex background="mainBackground" column gap={2} padding={[3]}>
        <Flex width="180px" gap={3}>
          <GaugeComponent chart={chart2} />
          <EasyPieComponent chart={chart3} />
        </Flex>
        <Line chart={chart} height="315px" />
        <GroupBoxes
          chart={chart4}
          renderBoxPopover={renderBoxPopover}
          renderGroupPopover={renderGroupPopover}
        />
      </Flex>
    </ThemeProvider>
  )
}

export default {
  title: "Agent V2",
  component: OneChart,
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

export const OneChart = Template.bind({})

OneChart.args = {
  nodesScope: "*",
  contextScope: "k8s.cgroup.cpu_limit",
  contexts: "*",
  singleDimension: "*",
  theme: "default",
  host: "http://10.10.11.2:19999/api/v2/data", // "http://192.168.1.205:19999/api/v2/data",
}
