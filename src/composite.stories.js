import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/lib/theme"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { camelizeKeys } from "@/helpers/objectTransform"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import systemCpuChart from "@/fixtures/compositeSystemCpuChart"
import systemCpu from "@/fixtures/compositeSystemCpu"

const metadata = camelizeKeys(systemCpuChart, { omit: ["dimensions"] })

const getChartMetadata = () => metadata
const getChart = makeMockPayload(systemCpu, { delay: 600 })

export const Simple = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({
    getChart,
    attributes: { aggregationMethod: "avg", valueRange: [0, 100] },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const SimpleDark = () => {
  const sdk = makeDefaultSDK({ getChartMetadata, attributes: { theme: "dark" } })
  const chart = sdk.makeChart({
    getChart,
    attributes: { aggregationMethod: "avg", valueRange: [0, 100] },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground">
        <Line chart={chart} height="315px" />
      </Flex>
    </ThemeProvider>
  )
}

export const DelayedMetadata = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })

  const chartsMetadata = {
    get: () => ({}),
    fetch: () => new Promise(() => {}),
  }

  const chart = sdk.makeChart({
    getChart,
    chartsMetadata,
    attributes: { valueRange: [0, 100] },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export default {
  title: "Composite",
  component: Simple,
}
