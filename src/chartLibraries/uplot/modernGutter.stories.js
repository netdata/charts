import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeDefaultSDK from "@/makeDefaultSDK"
import makeMockPayload from "@/helpers/makeMockPayload"
import { makePayload, makeWave } from "@/helpers/makeWavePayload"

const cpuPayload = makePayload({
  context: "gutter.system.cpu",
  title: "CPU utilization",
  unit: "percentage",
  dimensions: [{ id: "user", values: makeWave({ center: 42, amplitude: 20, cycles: 2 }) }],
})

const trafficPayload = makePayload({
  context: "gutter.net.traffic",
  title: "Traffic",
  unit: "kilobits/s",
  dimensions: [
    { id: "received", values: makeWave({ center: 840000, amplitude: 320000, cycles: 1.6 }) },
  ],
})

const rows = [
  { label: "Short labels", payload: cpuPayload },
  { label: "Wide labels", payload: trafficPayload },
  {
    label: "Explicit yAxisLabelWidth (40px) is kept",
    payload: trafficPayload,
    attributes: { yAxisLabelWidth: 40 },
  },
]

const useChart = ({ payload, attributes }, designFlavour, theme) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({ attributes: { theme, designFlavour, expandable: false } })
    const node = sdk.makeChart({
      getChart: makeMockPayload(payload, { delay: 0 }),
      attributes: { chartLibrary: "uplot", chartType: "line", ...attributes },
    })
    sdk.appendChild(node)
    return node
  }, [payload, attributes, designFlavour, theme])

  useEffect(() => () => chart.destroy(), [chart])

  return chart
}

const Cell = ({ row, designFlavour, theme }) => {
  const chart = useChart(row, designFlavour, theme)

  return (
    <Flex column gap={1} width="100%">
      <TextMicro color="textLite">{designFlavour}</TextMicro>
      <Flex height="200px" background="mainChartBg" round={1}>
        <Line chart={chart} height="100%" width="100%" />
      </Flex>
    </Flex>
  )
}

const Page = ({ theme }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex column gap={6} padding={[4]} background="mainBackground" width="100%">
      {rows.map(row => (
        <Flex column gap={2} key={row.label} width="100%">
          <TextSmall strong>{row.label}</TextSmall>
          <Flex gap={3} width="100%">
            {["modern", "default"].map(designFlavour => (
              <Cell key={designFlavour} row={row} designFlavour={designFlavour} theme={theme} />
            ))}
          </Flex>
        </Flex>
      ))}
    </Flex>
  </ThemeProvider>
)

export const Light = () => <Page theme="default" />

export const Dark = () => <Page theme="dark" />

export default {
  title: "Modern/Y-axis gutter",
}
