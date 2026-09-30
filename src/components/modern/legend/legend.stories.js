import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import { makePayload, makeWave } from "@/helpers/makeWavePayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import systemLoadLine from "../../../../fixtures/systemLoadLine"

const [loadPayload] = systemLoadLine

const makeSeries = (context, title, count) =>
  makePayload({
    context,
    title,
    unit: "percentage",
    dimensions: Array.from({ length: count }, (_, index) => ({
      id: index < 26 ? `sd${String.fromCharCode(97 + index)}` : `sd${index}`,
      values: makeWave({
        center: 20 + index * 5,
        amplitude: 4 + (index % 4) * 2,
        cycles: 1.6 + (index % 5) * 0.4,
        phase: index * 0.7,
      }),
    })),
  })

const fivePayload = makeSeries("modern.disk.five", "Disk utilization", 5)
const manyPayload = makeSeries("modern.disk.many", "Disk utilization per device", 14)
const hugePayload = makeSeries("modern.disk.huge", "Disk utilization, 2000 devices", 2000)

const cards = [
  { label: "Tile (360px): no legend, compact tooltip", payload: loadPayload, width: "360px" },
  { label: "3 series (640px): direct labels", payload: loadPayload, width: "640px" },
  { label: "5 series (640px): one-line legend", payload: fivePayload, width: "640px" },
  { label: "14 series (640px): side table", payload: manyPayload, width: "640px" },
  { label: "Wide (1000px): side table", payload: loadPayload, width: "1000px" },
  {
    label: "Stacked, 3 series (640px): direct falls back to one line",
    payload: loadPayload,
    width: "640px",
    chartType: "stacked",
  },
  {
    label: "2000 series (1000px): windowed side table",
    payload: hugePayload,
    width: "1000px",
  },
  {
    label: "2000 series (640px): one-line legend capped, +N more opens the drawer",
    payload: hugePayload,
    width: "640px",
    legendLayout: "below",
  },
]

const useCharts = (theme, chartLibrary) => {
  const charts = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: { theme, designFlavour: "modern", navigation: "pan", expandable: true },
    })

    return cards.map(({ payload, chartType = "line", legendLayout }) => {
      const chart = sdk.makeChart({
        getChart: makeMockPayload(payload, { delay: 0 }),
        attributes: { chartLibrary, chartType, ...(legendLayout && { legendLayout }) },
      })
      sdk.appendChild(chart)
      return chart
    })
  }, [theme, chartLibrary])

  useEffect(() => () => charts.forEach(chart => chart.destroy()), [charts])

  return charts
}

export const LegendAndHover = ({ theme, chartLibrary }) => {
  const charts = useCharts(theme, chartLibrary)

  return (
    <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
      <Flex column gap={6} padding={[6]} background="mainBackground" width="100%">
        {cards.map((card, index) => (
          <Flex column gap={1} key={`${card.label}:${theme}:${chartLibrary}`}>
            <TextSmall strong>{card.label}</TextSmall>
            <TextMicro color="textLite">
              Hover a legend entry to dim the other series; click toggles, Shift/Ctrl/Cmd+click
              merges.
            </TextMicro>
            <Flex width={card.width} height="280px">
              <Line chart={charts[index]} height="100%" width="100%" />
            </Flex>
          </Flex>
        ))}
      </Flex>
    </ThemeProvider>
  )
}

LegendAndHover.args = { theme: "default", chartLibrary: "uplot" }
LegendAndHover.argTypes = {
  theme: { name: "Theme", control: "radio", options: ["default", "dark"] },
  chartLibrary: { name: "Renderer", control: "radio", options: ["uplot", "dygraph"] },
}

export const Light = args => <LegendAndHover {...args} />
Light.args = { theme: "default", chartLibrary: "uplot" }

export const Dark = args => <LegendAndHover {...args} />
Dark.args = { theme: "dark", chartLibrary: "uplot" }

export default {
  title: "Modern/Legend and hover",
  component: LegendAndHover,
}
