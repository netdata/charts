import { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
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
const makeLongNames = count =>
  makePayload({
    context: `modern.net.long${count}`,
    title: "Network traffic per interface",
    unit: "kilobits/s",
    dimensions: Array.from({ length: count }, (_, index) => ({
      id: `veth${index}a7f3c9e1-kubernetes-pod-network-interface-${index}`,
      values: makeWave({
        center: 1234567 + index * 98765,
        amplitude: 345678,
        cycles: 1.6 + (index % 5) * 0.4,
        phase: index * 0.7,
      }),
    })),
  })

const longNamesPayload = makeLongNames(10)
const longDirectPayload = makeLongNames(3)

const directPayload = makePayload({
  context: "modern.disk.ops",
  title: "Disk operations",
  unit: "operations/s",
  dimensions: ["reads_completed", "writes_completed", "discards_completed"].map((id, index) => ({
    id,
    values: makeWave({ center: 1200 + index * 900, amplitude: 300, phase: index * 0.7 }),
  })),
})

const cards = [
  { label: "Tile (360px): no legend, compact tooltip", payload: loadPayload, width: "360px" },
  { label: "3 series (640px): direct labels", payload: loadPayload, width: "640px" },
  {
    label: "3 series (640px): live edge, labels plus a glow on the newest points (uPlot)",
    payload: loadPayload,
    width: "640px",
    legendLayout: "live",
  },
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
    label: "14 series (640px): live edge falls back to the side table above 8",
    payload: manyPayload,
    width: "640px",
    legendLayout: "live",
  },
  {
    label: "2000 series (1000px): windowed side table",
    payload: hugePayload,
    width: "1000px",
  },
  {
    label: "2000 series (640px): one-line legend capped, +N more lists the rest",
    payload: hugePayload,
    width: "640px",
    legendLayout: "below",
  },
  {
    label: "Long names and values (640px): side table drops mean and max",
    payload: longNamesPayload,
    width: "640px",
  },
  {
    label: "Long names and values (1000px): side table",
    payload: longNamesPayload,
    width: "1000px",
  },
  {
    label: "Long names and values (1800px): side table grows with the chart",
    payload: longNamesPayload,
    width: "1800px",
  },
  {
    label: "Direct labels, medium names (640px): the column fits the labels",
    payload: directPayload,
    width: "640px",
  },
  {
    label: "Direct labels, long names (1400px): the column caps at 35% of the chart",
    payload: longDirectPayload,
    width: "1400px",
    legendLayout: "direct",
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
