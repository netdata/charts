import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui/lib/theme/default"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Chart from "@/components/chart"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"
import chartMetadata from "@/fixtures/dimensions3points90Chart"
import payloads from "@/fixtures/dimension3points90"

const getChartMetadata = () => chartMetadata
const getChart = makeMockPayload(payloads[0])

export const Simple = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({ getChart })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Chart chart={chart} />
    </ThemeProvider>
  )
}

export const Multiple = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })

  const charts = Array.from(Array(5)).map((v, index) => {
    const chart = sdk.makeChart({ attributes: { id: index }, getChart })
    sdk.appendChild(chart)

    return chart
  })

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex column gap={2}>
        {charts.map(chart => (
          <Chart key={chart.getUuid()} chart={chart} />
        ))}
      </Flex>
    </ThemeProvider>
  )
}

export const Sync = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })

  const charts = Array.from(Array(3)).map((v, index) => {
    const chart = sdk.makeChart({ attributes: { id: index, syncHover: index !== 1 }, getChart })
    sdk.appendChild(chart)
    return chart
  })

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex column gap={2}>
        {charts.map(chart => (
          <Chart key={chart.getUuid()} chart={chart} />
        ))}
      </Flex>
    </ThemeProvider>
  )
}

export const AutoPlay = () => {}

export default {
  title: "Charts",
  component: Simple,
}
