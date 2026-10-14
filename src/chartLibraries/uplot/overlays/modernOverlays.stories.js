import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeDefaultSDK from "@/makeDefaultSDK"
import makeMockPayload from "@/helpers/makeMockPayload"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import systemLoadLine from "../../../../fixtures/systemLoadLine"

const [loadPayload] = systemLoadLine

const cpuPayload = makePayload({
  context: "overlays.system.cpu",
  title: "CPU utilization",
  unit: "percentage",
  dimensions: [
    { id: "user", values: makeWave({ center: 58, amplitude: 22, cycles: 2.2, phase: 0.3 }) },
    { id: "system", values: makeWave({ center: 24, amplitude: 8, cycles: 2.6, phase: 1.1 }) },
  ],
})

const freePayload = makePayload({
  context: "overlays.disk.space",
  title: "Disk space available",
  unit: "percentage",
  dimensions: [{ id: "avail", values: makeWave({ center: 32, amplitude: 14, cycles: 1.4 }) }],
})

const nowSec = () => Math.floor(Date.now() / 1000)

const rows = [
  {
    label: "Thresholds, anomaly strip and annotations",
    payload: cpuPayload,
    overlays: now => ({
      thresholds: { type: "threshold", warning: 70, critical: 80 },
      deploy: { type: "annotation", timestamp: now - 420, color: "#0075F2" },
      restart: { type: "annotation", timestamp: now - 180, color: "#F59B9B", position: "bottom" },
    }),
  },
  {
    label: "Close thresholds: labels are offset",
    payload: cpuPayload,
    overlays: () => ({ thresholds: { type: "threshold", warning: 72, critical: 75 } }),
  },
  {
    label: "Low thresholds (critical below warning)",
    payload: freePayload,
    overlays: () => ({ thresholds: { type: "threshold", warning: 25, critical: 20 } }),
  },
  {
    label: "Triggered alert and alert range",
    payload: loadPayload,
    overlays: now => ({
      alarm: { type: "alarm", status: "critical", value: "3.1", when: now - 300 },
      range: {
        type: "alarmRange",
        status: "warning",
        whenTriggered: now - 720,
        whenLast: now - 540,
      },
    }),
  },
  {
    label: "Alert range with its triggered value",
    payload: loadPayload,
    overlays: now => ({
      range: {
        type: "alarmRange",
        status: "critical",
        valueTriggered: "3.4",
        whenTriggered: now - 720,
        whenLast: now - 540,
      },
    }),
  },
  {
    label: "Sparkline: overlays stay off, like the default sparkline",
    payload: cpuPayload,
    height: "64px",
    attributes: { sparkline: true },
    overlays: now => ({
      thresholds: { type: "threshold", warning: 70, critical: 80 },
      deploy: { type: "annotation", timestamp: now - 420, color: "#0075F2" },
    }),
  },
]

const useChart = ({ payload, overlays, attributes }, theme) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: { theme, designFlavour: "modern", navigation: "pan", expandable: false },
    })
    const node = sdk.makeChart({
      getChart: makeMockPayload(payload, { delay: 0 }),
      attributes: {
        chartLibrary: "uplot",
        chartType: "line",
        overlays: overlays(nowSec()),
        ...attributes,
      },
    })
    sdk.appendChild(node)
    return node
  }, [payload, overlays, attributes, theme])

  useEffect(() => () => chart.destroy(), [chart])

  return chart
}

const Cell = ({ row, theme }) => {
  const chart = useChart(row, theme)

  return (
    <Flex column gap={1} width="100%">
      <TextMicro color="textLite">{theme === "dark" ? "dark" : "light"}</TextMicro>
      <Flex height={row.height || "240px"} background="mainChartBg" round={1}>
        <Line chart={chart} height="100%" width="100%" />
      </Flex>
    </Flex>
  )
}

const Themed = ({ theme, children }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex background="mainBackground" padding={[3]} width="50%" round={1}>
      {children}
    </Flex>
  </ThemeProvider>
)

export const PlotOverlays = () => (
  <Flex column gap={6} padding={[4]} width="100%">
    {rows.map(row => (
      <Flex column gap={2} key={row.label} width="100%">
        <TextSmall strong>{row.label}</TextSmall>
        <Flex gap={2} width="100%">
          {["default", "dark"].map(theme => (
            <Themed key={theme} theme={theme}>
              <Cell row={row} theme={theme} />
            </Themed>
          ))}
        </Flex>
      </Flex>
    ))}
  </Flex>
)

export default {
  title: "Modern/Plot overlays",
  component: PlotOverlays,
}
