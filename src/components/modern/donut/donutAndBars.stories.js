import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import D3pie from "@/components/d3pie"
import Bars from "@/components/bars"
import makeDefaultSDK from "@/makeDefaultSDK"
import makeMockPayload from "@/helpers/makeMockPayload"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import systemLoadLine from "../../../../fixtures/systemLoadLine"

const [loadPayload] = systemLoadLine

const protocolPayload = makePayload({
  context: "modern.net.protocols",
  title: "Traffic by protocol",
  unit: "GiB",
  dimensions: [
    { id: "https", values: makeWave({ center: 412, amplitude: 40, phase: 0.2 }) },
    { id: "grpc", values: makeWave({ center: 188, amplitude: 30, phase: 1.1 }) },
    { id: "http", values: makeWave({ center: 96, amplitude: 20, phase: 2.3 }) },
    { id: "websocket", values: makeWave({ center: 54, amplitude: 10, phase: 0.7 }) },
    { id: "quic", values: makeWave({ center: 21, amplitude: 6, phase: 1.9 }) },
    { id: "ftp", values: makeWave({ center: 8, amplitude: 2, phase: 0.4 }) },
    { id: "smtp", values: makeWave({ center: 5, amplitude: 1, phase: 2.8 }) },
  ],
})

const processPayload = makePayload({
  context: "modern.apps.cpu",
  title: "Top processes by CPU",
  unit: "percentage",
  dimensions: [
    { id: "envoy", values: makeWave({ center: 64, amplitude: 6, phase: 0.3 }) },
    { id: "node", values: makeWave({ center: 41, amplitude: 5, phase: 1.3 }) },
    { id: "postgres", values: makeWave({ center: 27, amplitude: 4, phase: 2.1 }) },
    { id: "netdata", values: makeWave({ center: 3, amplitude: 1, phase: 0.8 }) },
    { id: "sshd", values: makeWave({ center: 1, amplitude: 0.4, phase: 1.7 }) },
  ],
})

const volumePayload = makePayload({
  context: "modern.disk.volumes",
  title: "Space by volume",
  unit: "GiB",
  dimensions: [
    {
      id: "data",
      name: "/var/lib/postgresql/data",
      values: makeWave({ center: 449, amplitude: 4 }),
    },
    { id: "logs", name: "/var/log/journal", values: makeWave({ center: 31.7, amplitude: 1 }) },
    { id: "tmp", name: "/tmp", values: makeWave({ center: 3.99, amplitude: 0.2 }) },
  ],
})

const cards = [
  {
    label: "Donut, 7 dimensions (top 5 + grouped)",
    Component: D3pie,
    chartLibrary: "d3pie",
    payload: protocolPayload,
  },
  {
    label: "Donut, system load fixture",
    Component: D3pie,
    chartLibrary: "d3pie",
    payload: loadPayload,
  },
  {
    label: "Donut, long names and mixed magnitudes",
    Component: D3pie,
    chartLibrary: "d3pie",
    payload: volumePayload,
  },
  { label: "Ranked bars", Component: Bars, chartLibrary: "bars", payload: processPayload },
  {
    label: "Ranked bars, full columns",
    Component: Bars,
    chartLibrary: "bars",
    payload: processPayload,
    attributes: { cols: "full" },
  },
]

const Card = ({ card, theme }) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({ attributes: { theme, designFlavour: "modern" } })
    const chart = sdk.makeChart({
      getChart: makeMockPayload(card.payload, { delay: 0 }),
      attributes: { chartLibrary: card.chartLibrary, ...card.attributes },
    })
    sdk.appendChild(chart)
    return chart
  }, [card, theme])

  useEffect(() => () => chart.destroy(), [chart])

  const { Component } = card

  return (
    <Flex column gap={1} width="360px">
      <TextMicro color="textLite">{card.label}</TextMicro>
      <Flex height="240px" background="mainChartBg" round={2} padding={[2]}>
        <Component chart={chart} height="100%" width="100%" />
      </Flex>
    </Flex>
  )
}

const Surface = ({ theme }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex column gap={3} padding={[6]} background="mainBackground" flex>
      <TextSmall strong>{theme === "dark" ? "Dark" : "Light"}</TextSmall>
      <Flex gap={4} flexWrap>
        {cards.map(card => (
          <Card key={`${card.label}:${theme}`} card={card} theme={theme} />
        ))}
      </Flex>
    </Flex>
  </ThemeProvider>
)

export const DonutAndBars = () => (
  <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
    <Surface theme="default" />
    <Surface theme="dark" />
  </div>
)

export default {
  title: "Modern/Donut and bars",
  component: DonutAndBars,
}
