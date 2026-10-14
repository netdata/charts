import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"
import systemLoadLine from "../fixtures/systemLoadLine"

const [payload] = systemLoadLine

const libraries = ["dygraph", "uplot"]

const rows = [
  { chartType: "line", label: "line" },
  { chartType: "line", label: "line, stepped", attributes: { stepPlot: true } },
  { chartType: "area", label: "area" },
  { chartType: "stacked", label: "stacked" },
  { chartType: "stackedBar", label: "stackedBar" },
  { chartType: "multiBar", label: "multiBar" },
  {
    chartType: "line",
    label: "sparkline",
    attributes: { sparkline: true },
    height: "60px",
    bare: true,
  },
]

const useParityCharts = (chartType, attributes) => {
  const charts = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: { theme: "default", navigation: "pan", expandable: false },
    })

    const made = libraries.map(chartLibrary => {
      const chart = sdk.makeChart({
        getChart: makeMockPayload(payload, { delay: 0 }),
        attributes: { chartLibrary, chartType, ...attributes },
      })
      sdk.appendChild(chart)
      return chart
    })

    return made
  }, [chartType, JSON.stringify(attributes)])

  useEffect(() => () => charts.forEach(chart => chart.destroy()), [charts])

  return charts
}

const ParityRow = ({ chartType, label, attributes, height = "220px", bare = false }) => {
  const charts = useParityCharts(chartType, attributes)

  return (
    <Flex column gap={1} width="100%">
      <TextSmall strong>{label}</TextSmall>
      <Flex gap={4} width="100%">
        {charts.map((chart, index) => (
          <Flex column gap={1} key={chart.getId()} width="50%">
            <TextMicro color="textLite">{libraries[index]}</TextMicro>
            <Flex height={height} width="100%">
              <Line
                chart={chart}
                height="100%"
                width="100%"
                {...(bare && { hasHeader: false, hasFooter: false, hasFilters: false })}
              />
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

export const SideBySide = () => (
  <ThemeProvider theme={DefaultTheme}>
    <Flex column gap={6} padding={[4]} width="100%" background="mainBackground">
      {rows.map(row => (
        <ParityRow key={`${row.chartType}-${row.label}`} {...row} />
      ))}
    </Flex>
  </ThemeProvider>
)

export default {
  title: "Charts/uPlot/Parity",
  parameters: { layout: "fullscreen" },
}
