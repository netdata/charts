import React, { useEffect, useMemo } from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextSmall, getSizeBy } from "@netdata/netdata-ui"
import Bars from "@/components/bars"
import D3pie from "@/components/d3pie"
import EasyPie from "@/components/easyPie"
import Gauge from "@/components/gauge"
import GroupBoxes from "@/components/groupBoxes"
import Line from "@/components/line"
import NumberChart from "@/components/number"
import Status from "@/components/status"
import Table from "@/components/table"
import Fullscreen from "@/components/toolbox/fullscreen"
import Settings from "@/components/toolbox/settings"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

const now = 1729763970000
const points = 97
const updateEvery = 5

const Page = styled(Flex).attrs({
  column: true,
  gap: 6,
  padding: [4],
  width: { min: "0px", max: 360, base: "100%" },
})`
  box-sizing: border-box;
`

const Matrix = styled(Flex).attrs({
  gap: 4,
  width: "100%",
})`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${getSizeBy(72)}, 1fr));
`

const ChartSurface = styled(Flex).attrs(({ height }) => ({
  column: true,
  width: { min: "0px", base: "100%" },
  height,
  background: "tableRowBg",
  position: "relative",
  round: true,
}))`
  box-sizing: border-box;
`

const range = values => ({
  min: Math.min(...values),
  max: Math.max(...values),
  avg: values.reduce((sum, value) => sum + value, 0) / values.length,
})

const makeWave = ({ center, amplitude, cycles = 2.5, phase = 0, ripple = 0.08 }) =>
  Array.from({ length: points }, (_, index) => {
    const progress = index / (points - 1)
    const primary = Math.sin(progress * Math.PI * 2 * cycles + phase)
    const secondary = Math.sin(progress * Math.PI * 2 * cycles * 0.37 + phase * 0.5)

    return center + amplitude * primary + amplitude * ripple * secondary
  })

const makeAnomalyRates = seed =>
  Array.from({ length: points }, (_, index) =>
    (index + seed * 7) % 47 === 0 ? 35 + ((index * 17 + seed * 11) % 65) : 0
  )

const makeDimensionStats = dimensions =>
  dimensions.reduce(
    (stats, dimension) => {
      const values = range(dimension.values)
      const anomalyRates = dimension.anomalyRates || []

      stats.min.push(values.min)
      stats.max.push(values.max)
      stats.avg.push(values.avg)
      stats.arp.push(anomalyRates.length ? range(anomalyRates).avg : 0)
      stats.con.push(0)
      return stats
    },
    { min: [], max: [], avg: [], arp: [], con: [] }
  )

const makePayload = ({ title, unit, dimensions, chartType = "line" }) => {
  const normalizedDimensions = dimensions.map((dimension, index) => ({
    ...dimension,
    anomalyRates: dimension.anomalyRates || makeAnomalyRates(index + 1),
  }))
  const allValues = normalizedDimensions.flatMap(dimension => dimension.values)
  const values = range(allValues)
  const dimensionStats = makeDimensionStats(normalizedDimensions)
  const ids = normalizedDimensions.map(dimension => dimension.id)
  const names = normalizedDimensions.map(dimension => dimension.name || dimension.id)
  const dimensionUnits = normalizedDimensions.map(dimension => dimension.unit || unit)
  const units = [...new Set(dimensionUnits)]
  const rows = Array.from({ length: points }, (_, index) => [
    now - (points - index - 1) * updateEvery * 1000,
    ...normalizedDimensions.map(dimension => [
      dimension.values[index],
      dimension.anomalyRates[index],
      0,
    ]),
  ])

  return {
    api: 2,
    versions: {},
    summary: {
      nodes: [],
      contexts: [
        {
          id: "storybook.units_scaling.chart_types",
          sts: { ...values, con: 100 },
        },
      ],
      instances: [],
      dimensions: normalizedDimensions.map((dimension, index) => ({
        id: dimension.id,
        pri: index,
        sts: {
          min: dimensionStats.min[index],
          max: dimensionStats.max[index],
          avg: dimensionStats.avg[index],
          con: 0,
        },
      })),
      labels: [],
      alerts: [],
    },
    totals: {},
    functions: [],
    result: {
      labels: ["time", ...ids],
      point: { value: 0, arp: 1, pa: 2 },
      data: rows,
    },
    db: {
      tiers: 1,
      update_every: updateEvery,
      first_entry: Math.floor(rows[0][0] / 1000),
      last_entry: Math.floor(rows[rows.length - 1][0] / 1000),
      units,
      dimensions: {
        ids,
        units: dimensionUnits,
        sts: dimensionStats,
      },
      per_tier: [],
    },
    view: {
      title,
      update_every: updateEvery,
      after: Math.floor(rows[0][0] / 1000),
      before: Math.floor(rows[rows.length - 1][0] / 1000),
      units,
      chart_type: chartType,
      dimensions: {
        grouped_by: ["dimension"],
        ids,
        names,
        units: dimensionUnits,
        priorities: normalizedDimensions.map((_, index) => index),
        aggregated: normalizedDimensions.map(() => 1),
        sts: dimensionStats,
      },
      ...values,
    },
  }
}

const makeSignedRateDimensions = () => [
  {
    id: "positive traffic",
    name: "positive traffic",
    values: makeWave({ center: 1.8e6, amplitude: 650000, phase: 0.2 }),
  },
  {
    id: "negative traffic",
    name: "negative traffic",
    values: makeWave({ center: -1.5e6, amplitude: 720000, phase: 1.4 }),
  },
  {
    id: "crossing zero",
    name: "crossing zero",
    values: makeWave({ center: 0, amplitude: 480000, cycles: 3.4, phase: 0.7 }),
  },
]

const makeSignedRatePayload = chartType =>
  makePayload({
    title: `Signed byte rate, ${chartType}`,
    unit: "By/s",
    dimensions: makeSignedRateDimensions(),
    chartType,
  })

const heatmapIds = [
  "bucket_-1048576",
  "bucket_-1024",
  "bucket_-1",
  "bucket_0",
  "bucket_1",
  "bucket_1024",
  "bucket_1048576",
  "bucket_+Inf",
]

const heatmapPayload = makePayload({
  title: "Signed heatmap bucket boundaries",
  unit: "events/s",
  chartType: "heatmap",
  dimensions: heatmapIds.map((id, bucketIndex) => ({
    id,
    name: id,
    values: Array.from({ length: points }, (_, index) => {
      const movingCenter = 3.5 + Math.sin((index / points) * Math.PI * 4) * 2.2
      const distance = bucketIndex - movingCenter
      return Math.max(0, Math.round(80 * Math.exp(-(distance * distance) / 2.5)))
    }),
  })),
})

const singleMetricPayload = ({ title, unit, center, amplitude, phase = -Math.PI / 2 }) =>
  makePayload({
    title,
    unit,
    dimensions: [
      {
        id: title.toLowerCase().replaceAll(" ", "-"),
        name: title,
        values: makeWave({ center, amplitude, cycles: 2, phase }),
      },
    ],
  })

const chartTypeCases = [
  { id: "line", title: "Line", chartType: "line" },
  { id: "area", title: "Area", chartType: "area" },
  { id: "stacked", title: "Stacked area", chartType: "stacked" },
  { id: "stacked-bar", title: "Stacked bar", chartType: "stackedBar" },
  { id: "multi-bar", title: "Multi bar", chartType: "multiBar" },
].map(item => ({
  ...item,
  chartLibrary: "dygraph",
  Component: Line,
  payload: makeSignedRatePayload(item.chartType),
  purpose: "Positive, negative, and crossing dimensions share one byte-rate scale.",
  height: "320px",
}))

const tileCases = [
  {
    id: "gauge",
    title: "Gauge",
    purpose: "A request rate crossing zero; bounds and the current value preserve their signs.",
    chartLibrary: "gauge",
    Component: Gauge,
    payload: singleMetricPayload({
      title: "Signed request rate",
      unit: "requests/s",
      center: 0,
      amplitude: 2.2e6,
    }),
  },
  {
    id: "easy-pie",
    title: "Easy pie",
    purpose: "A percentage moving across zero while the ring tracks its range position.",
    chartLibrary: "easypiechart",
    Component: EasyPie,
    payload: singleMetricPayload({
      title: "Signed percentage",
      unit: "%",
      center: 0,
      amplitude: 72,
    }),
  },
  {
    id: "number",
    title: "Number",
    purpose: "A pre-scaled KiB source shown as a signed, atomically scaled value.",
    chartLibrary: "number",
    Component: NumberChart,
    payload: singleMetricPayload({
      title: "Signed storage delta",
      unit: "KiB",
      center: -1800,
      amplitude: 700,
    }),
  },
  {
    id: "d3pie",
    title: "D3 pie",
    purpose: "Slice area uses magnitude; every label preserves the source sign.",
    chartLibrary: "d3pie",
    Component: D3pie,
    payload: makePayload({
      title: "Signed operation contributors",
      unit: "operations/s",
      dimensions: [
        {
          id: "positive contributor",
          values: makeWave({ center: 1.8e6, amplitude: 300000, phase: 0.4 }),
        },
        {
          id: "negative contributor",
          values: makeWave({ center: -850000, amplitude: 180000, phase: 1.2 }),
        },
        {
          id: "small contributor",
          values: makeWave({ center: 420, amplitude: 120, phase: 2.1 }),
        },
      ],
    }),
  },
  {
    id: "bars",
    title: "Bars",
    purpose: "Magnitude sorting and bar extent with signed atomic labels.",
    chartLibrary: "bars",
    Component: Bars,
    payload: makeSignedRatePayload("line"),
  },
  {
    id: "table",
    title: "Table",
    purpose: "Signed values and units occupy separate visual subcolumns.",
    chartLibrary: "table",
    Component: Table,
    payload: makeSignedRatePayload("line"),
    attributes: { tableColumns: ["dimension"] },
  },
  {
    id: "group-boxes",
    title: "Group boxes",
    purpose: "Magnitude controls color intensity while the popover preserves the sign.",
    chartLibrary: "groupBoxes",
    Component: GroupBoxes,
    payload: makeSignedRatePayload("line"),
  },
]

const toolboxElements = [Settings, Fullscreen]

const createChart = ({ id, payload, chartLibrary, attributes = {} }) => {
  const sdk = makeDefaultSDK({
    attributes: {
      contextScope: ["storybook.units_scaling.chart_types"],
      containerWidth: 1180,
      theme: "dark",
      designFlavour: "default",
      filterToolboxMode: "fixed",
      navigation: "pan",
      expandable: false,
    },
  })
  const chart = sdk.makeChart({
    getChart: makeMockPayload(payload),
    attributes: {
      id: `units-chart-types-${id}`,
      chartLibrary,
      contextScope: ["storybook.units_scaling.chart_types"],
      leftHeaderElements: [Status],
      toolboxElements,
      ...attributes,
    },
  })

  sdk.appendChild(chart)
  return chart
}

const ChartCase = ({ id, title, purpose, payload, chartLibrary, Component, attributes, height }) => {
  const chart = useMemo(
    () => createChart({ id, payload, chartLibrary, attributes }),
    [id, payload, chartLibrary, attributes]
  )

  useEffect(() => () => chart.destroy(), [chart])

  return (
    <Flex column gap={2} width={{ min: "0px", base: "100%" }}>
      <Flex column gap={1}>
        <TextSmall color="text" strong>
          {title}
        </TextSmall>
        <TextMicro color="textDescription">{purpose}</TextMicro>
      </Flex>
      <ChartSurface height={height || "280px"}>
        <Component chart={chart} height="100%" width="100%" />
      </ChartSurface>
    </Flex>
  )
}

const Section = ({ title, description, children }) => (
  <Flex column gap={3}>
    <Flex column gap={1}>
      <TextSmall color="text" strong>
        {title}
      </TextSmall>
      <TextMicro color="textDescription">{description}</TextMicro>
    </Flex>
    {children}
  </Flex>
)

export const SignedTimeSeries = () => (
  <Page>
    <Section
      title="Signed time-series chart types"
      description="The same production-shaped payload is rendered through every Dygraph mode."
    >
      {chartTypeCases.map(item => (
        <ChartCase key={item.id} {...item} />
      ))}
    </Section>
    <Section
      title="Signed heatmap boundaries"
      description="Bucket boundaries span negative and positive binary magnitudes. Cell values remain counts."
    >
      <ChartCase
        id="heatmap"
        title="Heatmap"
        purpose="Signed bucket labels are sorted numerically and scaled from their magnitude."
        chartLibrary="dygraph"
        Component={Line}
        payload={heatmapPayload}
        height="340px"
      />
    </Section>
  </Page>
)

SignedTimeSeries.parameters = {
  netdataTheme: "dark",
}

export const SignedTilesAndGauges = () => (
  <Page>
    <Section
      title="Signed tiles, gauges, and pies"
      description="These are the non-Dygraph renderers selected by Cloud for chart-library payloads."
    >
      <Matrix>
        {tileCases.map(item => (
          <ChartCase key={item.id} {...item} />
        ))}
      </Matrix>
    </Section>
  </Page>
)

SignedTilesAndGauges.parameters = {
  netdataTheme: "dark",
}

export default {
  title: "Charts/Units scaling/Chart types",
}
