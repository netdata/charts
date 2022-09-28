import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui/lib/theme"
import { camelizeKeys } from "@/helpers/objectTransform"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import systemCpuChart from "@/fixtures/compositeSystemCpuChart"
import systemCpu from "@/fixtures/compositeSystemCpu"
import Line from "@/components/line"

const metadata = camelizeKeys(systemCpuChart, { omit: ["dimensions"] })

const getChartMetadata = () => metadata
const getChart = makeMockPayload(systemCpu, { delay: 600 })

export const Heatmap = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({
    getChart,
    attributes: { chartLibrary: "uplot", composite: true, valueRange: [0, 100] },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="700px" />
    </ThemeProvider>
  )
}

export default {
  title: "uPlot",
  component: Heatmap,
}
