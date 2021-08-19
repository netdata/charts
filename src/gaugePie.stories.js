import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/lib/theme"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { camelizeKeys } from "@/helpers/objectTransform"
import EasyPie from "@/components/easyPie"
import GaugeComponent from "@/components/gauge"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import systemIoChart from "@/fixtures/systemIoChart"
import systemIoInGaugePie from "@/fixtures/systemIoInGaugePie"

const metadata = camelizeKeys(systemIoChart, { omit: ["dimensions"] })

const getChartMetadata = () => metadata
const getChart = makeMockPayload(systemIoInGaugePie, { delay: 600 })

export const Simple = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({ getChart, attributes: { chartLibrary: "easyPie" } })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="100px">
        <EasyPie chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const SimpleDark = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({ getChart, attributes: { chartLibrary: "easyPie", theme: "dark" } })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground" width="100px">
        <EasyPie chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const GaugePercent = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({
    getChart,
    attributes: { chartLibrary: "gauge", units: "percentage" },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="180px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const Gauge = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({
    getChart,
    attributes: { chartLibrary: "gauge" },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="180px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export default {
  title: "Easypie",
  component: Simple,
}
