import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import { makePayload, makeWave } from "../fixtures/makeWavePayload"
import makeDefaultSDK from "./makeDefaultSDK"
import systemLoadLine from "../fixtures/systemLoadLine"

const [loadPayload] = systemLoadLine
const libraries = ["dygraph", "uplot"]

const cpuPayload = makePayload({
  context: "design.system.cpu",
  title: "CPU utilization",
  unit: "percentage",
  dimensions: [
    { id: "user", values: makeWave({ center: 26, amplitude: 9, cycles: 2.2, phase: 0.3 }) },
    { id: "system", values: makeWave({ center: 13, amplitude: 5, cycles: 2.6, phase: 1.1 }) },
  ],
})

const manyPayload = makePayload({
  context: "design.disk.busy",
  title: "Disk utilization per device",
  unit: "percentage",
  dimensions: Array.from({ length: 12 }, (_, index) => ({
    id: `sd${String.fromCharCode(97 + index)}`,
    values: makeWave({
      center: 20 + index * 5,
      amplitude: 4 + (index % 4) * 2,
      cycles: 1.6 + (index % 5) * 0.4,
      phase: index * 0.7,
    }),
  })),
})

const burst = (index, center, width, peak) => {
  const distance = Math.abs(index - center) / width
  return distance > 1 ? 0 : peak * (1 - distance * distance)
}

const anomalyPayload = makePayload({
  context: "design.system.cpu",
  title: "CPU utilization",
  unit: "percentage",
  dimensions: [
    {
      id: "user",
      values: makeWave({ center: 26, amplitude: 9, cycles: 2.2, phase: 0.3 }),
      anomalyRates: Array.from({ length: 97 }, (_, i) =>
        Math.max(burst(i, 38, 6, 42), burst(i, 78, 3, 12), i % 11 === 0 ? 1 : 0)
      ),
    },
    { id: "system", values: makeWave({ center: 13, amplitude: 5, cycles: 2.6, phase: 1.1 }) },
  ],
})

const nowSec = () => Math.floor(Date.now() / 1000)

const rows = [
  { label: "Line, 3 series, live", payload: loadPayload, chartType: "line" },
  { label: "Area, 2 series, live", payload: cpuPayload, chartType: "area" },
  {
    label: "Modern area with anomalies",
    payload: anomalyPayload,
    chartType: "area",
    attributes: () => ({ designFlavour: "modern" }),
  },
  {
    label: "Line, 12 series",
    payload: manyPayload,
    chartType: "line",
  },
  {
    label: "Historical window",
    payload: loadPayload,
    chartType: "line",
    attributes: () => ({ after: nowSec() - 3600, before: nowSec() - 2700 }),
  },
]

const useRowCharts = ({ payload, chartType, attributes }, theme) => {
  const charts = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: { theme, navigation: "pan", expandable: false },
    })

    return libraries.map(chartLibrary => {
      const chart = sdk.makeChart({
        getChart: makeMockPayload(payload, { delay: 0 }),
        attributes: { chartLibrary, chartType, ...(attributes && attributes()) },
      })
      sdk.appendChild(chart)
      return chart
    })
  }, [payload, chartType, attributes, theme])

  useEffect(() => () => charts.forEach(chart => chart.destroy()), [charts])

  return charts
}

const Row = ({ row, theme }) => {
  const charts = useRowCharts(row, theme)

  return (
    <Flex column gap={2} width="100%">
      <TextSmall strong>{row.label}</TextSmall>
      <Flex gap={4} width="100%">
        {charts.map((chart, index) => (
          <Flex column gap={1} key={chart.getId()} width="50%">
            <TextMicro color="textLite">{libraries[index]}</TextMicro>
            <Flex height="260px" background="mainChartBg" round={1}>
              <Line chart={chart} height="100%" width="100%" />
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

export const LineAndArea = ({ theme }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex column gap={8} padding={[6]} background="mainBackground" width="100%">
      {rows.map(row => (
        <Row key={`${row.label}:${theme}`} row={row} theme={theme} />
      ))}
    </Flex>
  </ThemeProvider>
)

LineAndArea.args = { theme: "dark" }
LineAndArea.argTypes = {
  theme: { name: "Theme", control: "radio", options: ["dark", "default"] },
}

export default {
  title: "Charts/uPlot/Design refresh",
  component: LineAndArea,
}
