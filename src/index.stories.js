import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui/lib/theme/default"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Chart from "@/components/chart"
import payloads from "@/fixtures/dimension73points180"
import makeDefaultSDK from "./makeDefaultSDK"

export const Simple = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart()
  sdk.appendChild(chart)

  chart.doneFetch(payloads[0])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Chart chart={chart} />
    </ThemeProvider>
  )
}

export const Multiple = () => {
  const sdk = makeDefaultSDK()

  const charts = Array.from(Array(5)).map((v, index) => {
    const chart = sdk.makeChart({ id: index })
    sdk.appendChild(chart)
    chart.doneFetch(payloads[0])
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

export default {
  title: "Charts",
  component: Simple,
}
