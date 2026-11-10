import React, { useEffect, useMemo, useState } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import { makePayload } from "../fixtures/makeWavePayload"
import makeDefaultSDK from "./makeDefaultSDK"

const libraries = ["dygraph", "uplot"]
const designs = ["default", "modern"]
const points = 97

const bucketIds = [
  "duration_256",
  ...Array.from({ length: 10 }, (_, index) => `duration_${4 ** (index + 5)}`),
  "duration_+Inf",
]

const countAt = (bucketIndex, index) => {
  if (bucketIndex === 0 || bucketIndex === bucketIds.length - 1) return 0

  const center = 5 + Math.sin((index / points) * Math.PI * 3) * 2.5
  const distance = bucketIndex - center
  return Math.round(400 * Math.exp(-(distance * distance) / 1.6))
}

const payload = makePayload({
  context: "story.spans.duration",
  title: "Spans by duration",
  unit: "spans",
  chartType: "heatmap",
  dimensions: bucketIds.map((id, bucketIndex) => ({
    id,
    name: id,
    values: Array.from({ length: points }, (_, index) => countAt(bucketIndex, index)),
  })),
})

const blues = [
  "#DEEBF7",
  "#C6DBEF",
  "#9ECAE1",
  "#6BAED6",
  "#4292C6",
  "#2171B5",
  "#08519C",
  "#08306B",
]

const spanViewAttributes = {
  heatmapKeepEmptyRows: true,
  heatmapPalette: { default: blues, dark: [...blues].reverse() },
  heatmapColorScale: "log",
  heatmapCellGap: 1,
  heatmapLegend: "colors",
  heatmapCellClick: true,
  heatmapHoverCell: true,
  heatmapHoverColor: "#F28E2B",
  heatmapTooltipHideZeros: true,
  heatmapTooltipTopFirst: true,
  heatmapTooltipValueOnly: true,
  desiredUnits: ["original"],
  enabledAnnotations: false,
}

const sameCell = (a, b) => !!a && !!b && a.x === b.x && a.id === b.id

const useMarkedCell = chart => {
  const [cell, setCell] = useState(null)

  useEffect(
    () =>
      chart.on("heatmapCellClick", (x, id) =>
        setCell(current => (sameCell(current, { x, id }) ? null : { x, id }))
      ),
    [chart]
  )

  useEffect(() => {
    chart.updateAttribute("heatmapMarkedCell", cell)
  }, [chart, cell])
}

const useCharts = (design, theme, attributes) => {
  const charts = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: { theme, navigation: "pan", expandable: false, designFlavour: design },
    })

    return libraries.map(chartLibrary => {
      const chart = sdk.makeChart({
        getChart: makeMockPayload(payload, { delay: 0 }),
        attributes: {
          chartLibrary,
          chartType: "heatmap",
          heatmapBucketUnit: "ns",
          designFlavour: design,
          ...attributes,
        },
      })
      sdk.appendChild(chart)
      return chart
    })
  }, [design, theme, attributes])

  useEffect(() => () => charts.forEach(chart => chart.destroy()), [charts])

  return charts
}

const Cell = ({ chart, label }) => {
  useMarkedCell(chart)

  return (
    <Flex column gap={1} width="50%">
      <TextMicro color="textLite">{label}</TextMicro>
      <Flex height="320px" background="mainChartBg" round={1}>
        <Line chart={chart} height="100%" width="100%" />
      </Flex>
    </Flex>
  )
}

const Row = ({ design, theme, attributes }) => {
  const charts = useCharts(design, theme, attributes)

  return (
    <Flex column gap={2} width="100%">
      <TextSmall strong>{design === "modern" ? "Modern design" : "Classic design"}</TextSmall>
      <Flex gap={4} width="100%">
        {charts.map((chart, index) => (
          <Cell key={chart.getId()} chart={chart} label={libraries[index]} />
        ))}
      </Flex>
    </Flex>
  )
}

const Grid = ({ theme, attributes }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex column gap={8} padding={[6]} background="mainBackground" width="100%">
      {designs.map(design => (
        <Row key={`${design}:${theme}`} design={design} theme={theme} attributes={attributes} />
      ))}
    </Flex>
  </ThemeProvider>
)

const defaultAttributes = {}

export const Defaults = ({ theme }) => <Grid theme={theme} attributes={defaultAttributes} />

export const SpanViewOptions = ({ theme }) => <Grid theme={theme} attributes={spanViewAttributes} />

const args = { theme: "dark" }
const argTypes = { theme: { name: "Theme", control: "radio", options: ["dark", "default"] } }

Defaults.args = args
Defaults.argTypes = argTypes
SpanViewOptions.args = args
SpanViewOptions.argTypes = argTypes

export default {
  title: "Charts/Heatmap",
  component: Defaults,
}
