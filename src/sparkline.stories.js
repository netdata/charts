import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/lib/theme"
import { camelizeKeys } from "@/helpers/objectTransform"
import Sparkline from "@/components/line/sparkline"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import cgroupCpuSparklineChart from "@/fixtures/cgroupCpuSparklineChart"
import cgroupCpuSparkline from "@/fixtures/cgroupCpuSparkline"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

const getChartMetadata = () => camelizeKeys(cgroupCpuSparklineChart, { omit: ["dimensions"] })
const getChart = makeMockPayload(cgroupCpuSparkline, { delay: 600 })

export const Simple = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({
    getChart,
    attributes: {
      sparkline: true,
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="200px">
        <Sparkline chart={chart} height="100px" />
      </Flex>
    </ThemeProvider>
  )
}

export const SimpleDark = () => {
  const sdk = makeDefaultSDK({ getChartMetadata, attributes: { theme: "dark", sparkline: true } })
  const chart = sdk.makeChart({ getChart })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground" width="200px">
        <Sparkline chart={chart} height="100px" />
      </Flex>
    </ThemeProvider>
  )
}

export const InitialLoading = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({ getChart: () => new Promise(() => {}) })
  const darkChart = sdk.makeChart({
    getChart: () => new Promise(() => {}),
    attributes: { theme: "dark", sparkline: true },
  })
  sdk.appendChild(chart)
  sdk.appendChild(darkChart)

  return (
    <div>
      <ThemeProvider theme={DefaultTheme}>
        <Sparkline chart={chart} height="100px" />
      </ThemeProvider>
      <ThemeProvider theme={DarkTheme}>
        <Flex background="mainBackground" margin={[10, 0, 0]}>
          <Sparkline chart={darkChart} height="100px" />
        </Flex>
      </ThemeProvider>
    </div>
  )
}

export default {
  title: "Sparkline",
  component: Simple,
}
