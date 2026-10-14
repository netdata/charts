import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall } from "@netdata/netdata-ui"
import GaugeComponent from "@/components/gauge"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import systemLoadLine from "../../../../fixtures/systemLoadLine"

const green = ["#00AB44", "#00AB44"]
const yellow = ["#FFCC26", "#FFCC26"]
const red = ["#F95251", "#F95251"]

const variants = [
  { label: "No thresholds", attributes: {} },
  {
    label: "Within thresholds",
    attributes: {
      gaugeThresholds: [
        { id: "ok", from: 0, color: green },
        { id: "warn", from: 105, color: yellow },
        { id: "crit", from: 115, color: red },
      ],
    },
  },
  {
    label: "Warning zone",
    attributes: {
      gaugeThresholds: [
        { id: "ok", from: 0, color: green },
        { id: "warn", from: 1, color: yellow },
        { id: "crit", from: 115, color: red },
      ],
    },
  },
  {
    label: "Critical zone",
    attributes: {
      gaugeThresholds: [
        { id: "ok", from: 0, color: green },
        { id: "warn", from: 1, color: yellow },
        { id: "crit", from: 2, color: red },
      ],
    },
  },
  {
    label: "Auto range, 3 decimals",
    attributes: { staticValueRange: null, staticFractionDigits: 3 },
  },
  {
    label: "Critical, 4 decimals",
    attributes: {
      staticFractionDigits: 4,
      gaugeThresholds: [
        { id: "ok", from: 0, color: green },
        { id: "crit", from: 2, color: red },
      ],
    },
  },
]

const useCharts = theme => {
  const charts = useMemo(() => {
    const sdk = makeDefaultSDK({ attributes: { theme, designFlavour: "modern" } })

    return variants.map(({ attributes }) => {
      const chart = sdk.makeChart({
        getChart: makeMockPayload(systemLoadLine[0], { delay: 300 }),
        attributes: {
          contextScope: ["system.load"],
          chartLibrary: "gauge",
          staticValueRange: [0, 120],
          ...attributes,
        },
      })
      sdk.appendChild(chart)
      return chart
    })
  }, [theme])

  useEffect(() => () => charts.forEach(chart => chart.destroy()), [charts])

  return charts
}

const Grid = ({ theme }) => {
  const charts = useCharts(theme)

  return (
    <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
      <Flex background="mainBackground" padding={[6]} gap={4} flexWrap>
        {variants.map(({ label }, index) => (
          <Flex key={label} column gap={2}>
            <TextSmall color="textLite">{label}</TextSmall>
            <Flex width="260px" height="220px" background="mainChartBg" round>
              <GaugeComponent chart={charts[index]} />
            </Flex>
          </Flex>
        ))}
      </Flex>
    </ThemeProvider>
  )
}

export const Light = () => <Grid theme="default" />

export const Dark = () => <Grid theme="dark" />

Dark.parameters = { netdataTheme: "dark" }

export default {
  title: "Modern/Gauge",
  component: Light,
}
