import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/lib/theme"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Text } from "@netdata/netdata-ui/lib/components/typography"
import { camelizeKeys } from "@/helpers/objectTransform"
import GroupBoxes from "@/components/groupBoxes"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import kubernetesCpuLimitChart from "@/fixtures/kubernetesCpuLimitChart"
import kubernetesCpuLimit from "@/fixtures/kubernetesCpuLimit"

const metadata = camelizeKeys(kubernetesCpuLimitChart, { omit: ["dimensions", "chartLabels"] })

const getChartMetadata = () => metadata
const getChart = makeMockPayload(kubernetesCpuLimit, { delay: 600 })

const Popover = ({ children }) => (
  <Flex background="elementBackground" padding={[4]} round border>
    <Text>{children}</Text>
  </Flex>
)

const renderBoxPopover = () => <Popover>Box Popover</Popover>
const renderGroupPopover = () => <Popover>Group Popover</Popover>

const makeChart = props => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({
    getChart,
    attributes: {
      chartLibrary: "groupBoxes",
      groupBy: ["label"],
      groupByLabel: ["k8s_namespace", "k8s_container_id"],
      postGroupBy: "k8s_container_id", // DEPRECATE
      aggregationGroups: [
        "k8s_cluster_id",
        "k8s_container_name",
        "k8s_controller_kind",
        "k8s_controller_name",
        "k8s_kind",
        "k8s_node_name",
        "k8s_pod_name",
        "k8s_pod_uid",
      ],
      ...props,
    },
  })
  sdk.appendChild(chart)

  return chart
}

export const Simple = () => {
  const chart = makeChart()

  return (
    <ThemeProvider theme={DefaultTheme}>
      <GroupBoxes
        chart={chart}
        height="315px"
        renderBoxPopover={renderBoxPopover}
        renderGroupPopover={renderGroupPopover}
      />
    </ThemeProvider>
  )
}

export const SimpleDark = () => {
  const chart = makeChart({ theme: "dark" })

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground">
        <GroupBoxes
          chart={chart}
          height="315px"
          renderBoxPopover={renderBoxPopover}
          renderGroupPopover={renderGroupPopover}
        />
      </Flex>
    </ThemeProvider>
  )
}

export default {
  title: "GroupBoxes",
  component: Simple,
}
