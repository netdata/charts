import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import NumberComponent from "@/components/number"
import EasyPieComponent from "@/components/easyPie"
import makeMockPayload from "@/helpers/makeMockPayload"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import systemLoadLine from "../../../../fixtures/systemLoadLine"

const [loadPayload] = systemLoadLine

const withAlerts = (payload, alerts) => ({
  ...payload,
  summary: { ...payload.summary, alerts },
})

const single = ({ context, title, unit, id, values }) =>
  makePayload({ context, title, unit, dimensions: [{ id, values }] })

const percentBands = [
  { id: "base", from: 0, color: ["#00AB44", "#00AB44"] },
  { id: "warn", from: 80, color: ["#FF9700", "#FF9700"] },
  { id: "crit", from: 95, color: ["#DB162F", "#DB162F"] },
]

const stats = [
  { label: "System load (fixture), quiet", payload: loadPayload },
  {
    label: "Requests, quiet",
    payload: single({
      context: "modern.requests",
      title: "Requests",
      unit: "requests/s",
      id: "requests",
      values: makeWave({ center: 1840, amplitude: 260, cycles: 3 }),
    }),
  },
  {
    label: "Error rate, warning alert raised",
    payload: withAlerts(
      single({
        context: "modern.errors",
        title: "Error rate",
        unit: "percentage",
        id: "5xx",
        values: makeWave({ center: 2.4, amplitude: 1.2, cycles: 2 }).map((v, i) =>
          i > 80 ? v + 2.2 : v
        ),
      }),
      [{ nm: "web_5xx_rate", wr: 1 }]
    ),
  },
  {
    label: "Disk used, value threshold crossed",
    payload: single({
      context: "modern.disk",
      title: "Disk used",
      unit: "percentage",
      id: "used",
      values: makeWave({ center: 86, amplitude: 3, cycles: 1.4 }),
    }),
    attributes: { gaugeThresholds: percentBands },
  },
]

stats.push({ ...stats[1], label: "Small tile", width: "150px", height: "110px" })

const cores = [92, 71, 64, 58, 47, 33, 29, 81]

const rings = cores.map((center, index) => ({
  label: `cpu${index}`,
  payload: single({
    context: `modern.cpu${index}`,
    title: `cpu${index}`,
    unit: "percentage",
    id: "utilization",
    values: makeWave({ center, amplitude: 2, cycles: 1 + index * 0.2, phase: index }),
  }),
  attributes: { staticValueRange: [0, 100], gaugeThresholds: percentBands },
}))

rings.push({
  label: "no thresholds",
  payload: rings[5].payload,
  attributes: { staticValueRange: [0, 100] },
})

rings.push({
  label: "critical alert",
  payload: withAlerts(rings[3].payload, [{ nm: "cpu_usage", cr: 1 }]),
  attributes: { staticValueRange: [0, 100] },
})

const useCharts = (cases, chartLibrary, theme, designFlavour) => {
  const charts = useMemo(() => {
    const sdk = makeDefaultSDK({ attributes: { theme, designFlavour, expandable: false } })

    return cases.map(({ payload, attributes }) => {
      const chart = sdk.makeChart({
        getChart: makeMockPayload(payload, { delay: 0 }),
        attributes: { chartLibrary, ...attributes },
      })
      sdk.appendChild(chart)
      return chart
    })
  }, [cases, chartLibrary, theme, designFlavour])

  useEffect(() => () => charts.forEach(chart => chart.destroy()), [charts])

  return charts
}

const Tile = ({ label, width, height, children }) => (
  <Flex column gap={1} width={width}>
    <TextMicro color="textLite">{label}</TextMicro>
    <Flex
      height={height}
      background="mainChartBg"
      border={{ side: "all", color: "mainChartBorder" }}
      round={3}
      overflow="hidden"
    >
      {children}
    </Flex>
  </Flex>
)

const Board = ({ theme, designFlavour }) => {
  const statCharts = useCharts(stats, "number", theme, designFlavour)
  const ringCharts = useCharts(rings, "easypiechart", theme, designFlavour)

  return (
    <Flex column gap={6}>
      <TextSmall strong>{`Stat panels (${designFlavour})`}</TextSmall>
      <Flex gap={4} flexWrap>
        {statCharts.map((chart, index) => (
          <Tile
            key={chart.getId()}
            label={stats[index].label}
            width={stats[index].width || "300px"}
            height={stats[index].height || "180px"}
          >
            <NumberComponent chart={chart} height="100%" width="100%" />
          </Tile>
        ))}
      </Flex>
      <TextSmall strong>{`Rings (${designFlavour})`}</TextSmall>
      <Flex gap={3} flexWrap>
        {ringCharts.map((chart, index) => (
          <Tile key={chart.getId()} label={rings[index].label} width="130px" height="150px">
            <EasyPieComponent chart={chart} height="100%" width="100%" />
          </Tile>
        ))}
      </Flex>
    </Flex>
  )
}

const Page = ({ theme, compare }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex column gap={10} padding={[6]} background="mainBackground" width="100%">
      <Board key={`modern:${theme}`} theme={theme} designFlavour="modern" />
      {compare && <Board key={`default:${theme}`} theme={theme} designFlavour="default" />}
    </Flex>
  </ThemeProvider>
)

export const Light = args => <Page {...args} theme="default" />
Light.args = { compare: false }

export const Dark = args => <Page {...args} theme="dark" />
Dark.args = { compare: false }

export default {
  title: "Modern/Number and rings",
  argTypes: {
    compare: { name: "Show the default flavour below", control: "boolean" },
  },
}
