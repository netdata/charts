import React, { useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"
import systemLoadLine from "../fixtures/systemLoadLine"

const getChart = makeMockPayload(systemLoadLine[0], { delay: 600 })

export const Benchmark = ({ chartLibrary, count }) => {
  const charts = useMemo(() => {
    const sdk = makeDefaultSDK({ attributes: { chartLibrary, perfMonitor: true } })

    return Array.from({ length: count }, () => {
      const chart = sdk.makeChart({ getChart, attributes: { contextScope: ["system.load"] } })
      sdk.appendChild(chart)
      return chart
    })
  }, [chartLibrary, count])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex flexWrap gap={2}>
        {charts.map(chart => (
          <Line key={chart.getId()} chart={chart} height="200px" width="320px" />
        ))}
      </Flex>
    </ThemeProvider>
  )
}

Benchmark.args = { chartLibrary: "dygraph", count: 25 }
Benchmark.argTypes = {
  chartLibrary: { name: "Chart library", control: "select", options: ["dygraph", "uplot"] },
  count: { name: "Chart count", control: "select", options: [10, 25, 50] },
}

export default {
  title: "Perf/Benchmark",
  component: Benchmark,
  parameters: {
    docs: {
      description: {
        component:
          "Streaming dygraph-vs-uPlot A/B. Set library + count, let it stream ~60s, use the HUD's copy button. The mock ignores requested point counts, so absolute numbers differ from production — compare the dygraph/uPlot ratio under identical settings.",
      },
    },
  },
}
