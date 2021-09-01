import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/lib/theme"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { camelizeKeys } from "@/helpers/objectTransform"
// import Line from "@/components/line"
import { KubernetesGroupBoxes } from "@/components/groupBox"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import kubernetesCpuLimitChart from "@/fixtures/kubernetesCpuLimitChart"
import kubernetesCpuLimit from "@/fixtures/kubernetesCpuLimit"

const metadata = camelizeKeys(kubernetesCpuLimitChart, { omit: ["dimensions", "chartLabels"] })

const getChartMetadata = () => metadata
const getChart = makeMockPayload(kubernetesCpuLimit, { delay: 600 })

export const Simple = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })

  const chart = sdk.makeChart({
    getChart,
    attributes: {
      composite: true,
      chartLibrary: "groupbox",
      groupBy: "k8s_namespace",
      postGroupBy: "k8s_container_id",
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
      postAggregationMethod: "avg",
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      {/* <Line chart={chart} height="315px" /> */}
    </ThemeProvider>
  )
}

export default {
  title: "Composite",
  component: Simple,
}
