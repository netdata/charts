import React from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import requests from "../fixtures/compositeRequests"

const getChart = makeMockPayload(requests, { delay: 600 })

export const Simple = () => {
  const sdk = makeDefaultSDK({})
  const chart = sdk.makeChart({
    getChart,
    attributes: { aggregationMethod: "avg" },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const SimpleDark = () => {
  const sdk = makeDefaultSDK({ attributes: { theme: "dark" } })
  const chart = sdk.makeChart({
    getChart,
    attributes: { aggregationMethod: "avg" },
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

export default {
  title: "Composite",
  component: Simple,
}
