import React from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import cgroupCpuSparkline from "../fixtures/cgroupCpuSparklineOverview"
import systemCpuSparkline from "../fixtures/systemCpuSparkline"

const getChart = makeMockPayload(cgroupCpuSparkline, { delay: 600 })

export const Simple = () => {
  const sdk = makeDefaultSDK()
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
  const sdk = makeDefaultSDK({ attributes: { theme: "dark", sparkline: true } })
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
  const sdk = makeDefaultSDK()
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

export const SimpleNodes = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart: makeMockPayload(systemCpuSparkline, { delay: 600 }),
    attributes: {
      id: systemCpuSparkline.id,
      sparkline: true,
      chartType: "area",
      colors: ["#536775"],
      overlays: {
        name: { type: "name", field: "id" },
        latestValue: { type: "latestValue", dimensionId: "sum" },
      },
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

export default {
  title: "Sparkline",
  component: Simple,
}
