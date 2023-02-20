import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui/lib/theme"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import systemCpu from "@/fixtures/compositeSystemCpu"

const getChartMetadata = () => ({})
export const Simple = () => {
  const sdk = makeDefaultSDK({ getChartMetadata })
  const chart = sdk.makeChart({
    // getChart,
    attributes: {
      id: "net.net",
      host: "http://192.168.1.205:19999/api/v2/data",
      dimensionsAggregationMethod: "avg",
      agent: true,
      composite: true,
    },
  })

  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex padding={[50, 0]}>
        <Line chart={chart} height="315px" />
      </Flex>
    </ThemeProvider>
  )
}

export default {
  title: "Agent V2",
  component: Simple,
}
