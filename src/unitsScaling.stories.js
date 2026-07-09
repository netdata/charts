import React, { useEffect, useMemo } from "react"
import styled, { ThemeProvider } from "styled-components"
import { DefaultTheme, Flex, TextMicro, TextSmall } from "@netdata/netdata-ui"
import Line from "@/components/line"
import {
  useChart,
  useForceUpdate,
  useImmediateListener,
  withChartProvider,
} from "@/components/provider"
import { unregister } from "@/helpers/makeListeners"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

const now = 1729763970000
const updateEvery = 5

const Page = styled(Flex).attrs({
  column: true,
  gap: 4,
  padding: [4],
})`
  box-sizing: border-box;
  width: 100%;
  max-width: 1280px;
`

const CaseShell = styled(Flex).attrs({
  column: true,
  gap: 2,
})`
  border: 1px solid #dbe1e1;
  border-radius: 6px;
  overflow: hidden;
`

const CaseHeader = styled(Flex).attrs({
  column: true,
  gap: 1,
  padding: [2, 3],
})`
  background: #f7f8f8;
  border-bottom: 1px solid #dbe1e1;
`

const DiagnosticsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 1.2fr) repeat(6, minmax(80px, 1fr));
  gap: 1px;
  background: #dbe1e1;
  overflow-x: auto;
`

const DiagnosticCell = styled(TextMicro).attrs({
  padding: [1, 1.5],
})`
  background: #fff;
  white-space: nowrap;
`

const DiagnosticHead = styled(DiagnosticCell).attrs({
  strong: true,
})`
  background: #f7f8f8;
`

const Button = styled.button`
  appearance: none;
  border: 1px solid #cfd5da;
  border-radius: 4px;
  background: ${({ active }) => (active ? "#00ab44" : "#fff")};
  color: ${({ active }) => (active ? "#fff" : "#35414a")};
  cursor: pointer;
  font-size: 12px;
  line-height: 18px;
  padding: 2px 8px;

  &:hover {
    border-color: #00ab44;
  }
`

const range = values => ({
  min: Math.min(...values),
  max: Math.max(...values),
  avg: values.reduce((sum, value) => sum + value, 0) / values.length,
})

const makeDimensionStats = dimensions =>
  dimensions.reduce(
    (stats, dimension) => {
      const { min, max, avg } = range(dimension.values)
      stats.min.push(min)
      stats.max.push(max)
      stats.avg.push(avg)
      stats.arp.push(0)
      stats.con.push(0)
      return stats
    },
    { min: [], max: [], avg: [], arp: [], con: [] }
  )

const makeRows = dimensions => {
  const points = Math.max(...dimensions.map(dimension => dimension.values.length))
  return Array.from({ length: points }, (_, index) => [
    now - (points - index - 1) * updateEvery * 1000,
    ...dimensions.map(dimension => [dimension.values[index % dimension.values.length], 0, 0]),
  ])
}

const makePayload = ({ title, unit, dimensions }) => {
  const rows = makeRows(dimensions)
  const values = dimensions.flatMap(dimension => dimension.values)
  const { min, max, avg } = range(values)
  const dimensionStats = makeDimensionStats(dimensions)
  const units = Array.isArray(unit)
    ? unit
    : [...new Set(dimensions.map(dimension => dimension.unit || unit))]
  const ids = dimensions.map(dimension => dimension.id)
  const names = dimensions.map(dimension => dimension.name || dimension.id)
  const dimensionUnits = dimensions.map(dimension => dimension.unit || unit)

  return {
    api: 2,
    versions: {},
    summary: {
      nodes: [],
      contexts: [
        {
          id: "storybook.units_scaling",
          sts: { min, max, avg, con: 100 },
        },
      ],
      instances: [],
      dimensions: dimensions.map((dimension, index) => ({
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
      point: {
        value: 0,
        arp: 1,
        pa: 2,
      },
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
      chart_type: "line",
      dimensions: {
        grouped_by: ["dimension"],
        ids,
        names,
        units: dimensionUnits,
        priorities: dimensions.map((dimension, index) => dimension.priority ?? index),
        aggregated: dimensions.map(() => 1),
        sts: dimensionStats,
      },
      min,
      max,
    },
  }
}

const createChart = ({ id, payload, selectedLegendDimensions = [], attributes = {} }) => {
  const sdk = makeDefaultSDK({
    attributes: {
      contextScope: ["storybook.units_scaling"],
      containerWidth: 1000,
    },
  })
  const chart = sdk.makeChart({
    getChart: makeMockPayload(payload),
    attributes: {
      id,
      hasToolbox: false,
      filterToolboxMode: "floating",
      selectedLegendDimensions,
      ...attributes,
    },
  })
  sdk.appendChild(chart)
  return chart
}

const formatRaw = value =>
  Intl.NumberFormat(undefined, {
    useGrouping: true,
    maximumFractionDigits: 12,
  }).format(value)

const Diagnostics = withChartProvider(() => {
  const chart = useChart()
  const forceUpdate = useForceUpdate()

  useImmediateListener(
    () =>
      unregister(
        chart
          .on("payloadChanged", forceUpdate)
          .on("visibleDimensionsChanged", forceUpdate)
          .on("render", forceUpdate),
        chart.onAttributesChange(
          [
            "selectedLegendDimensions",
            "unitsConversionPrefix",
            "unitsConversionBase",
            "unitsConversionFractionDigits",
            "unitsConversionMethod",
          ],
          forceUpdate
        )
      ),
    [chart]
  )

  const payload = chart.getPayload()
  const ids = chart.getDimensionIds?.() || []
  const lastRow = payload.all?.[payload.all.length - 1]

  if (!ids.length || !lastRow) return null

  return (
    <DiagnosticsGrid>
      <DiagnosticHead>dimension</DiagnosticHead>
      <DiagnosticHead>raw latest</DiagnosticHead>
      <DiagnosticHead>shown latest</DiagnosticHead>
      <DiagnosticHead>unit</DiagnosticHead>
      <DiagnosticHead>range</DiagnosticHead>
      <DiagnosticHead>prefix/base</DiagnosticHead>
      <DiagnosticHead>digits</DiagnosticHead>
      {ids.map(id => {
        const raw = chart.getRowDimensionValue(id, lastRow, { allowNull: true, abs: false })
        const { prefix, base, fractionDigits } = chart.getUnitAttributes(id)
        const stats = payload.byDimension?.[id] || {}
        const visible = chart.isDimensionVisible(id)

        return (
          <React.Fragment key={id}>
            <DiagnosticCell opacity={visible ? null : "weak"}>
              {chart.getDimensionName(id) || id}
            </DiagnosticCell>
            <DiagnosticCell opacity={visible ? null : "weak"}>{formatRaw(raw)}</DiagnosticCell>
            <DiagnosticCell opacity={visible ? null : "weak"}>
              {chart.getConvertedValue(raw, { dimensionId: id })}
            </DiagnosticCell>
            <DiagnosticCell opacity={visible ? null : "weak"}>
              {chart.getUnitSign({ dimensionId: id }) || "-"}
            </DiagnosticCell>
            <DiagnosticCell opacity={visible ? null : "weak"}>
              {formatRaw(stats.min)} to {formatRaw(stats.max)}
            </DiagnosticCell>
            <DiagnosticCell opacity={visible ? null : "weak"}>
              {prefix || "-"} / {base || "-"}
            </DiagnosticCell>
            <DiagnosticCell opacity={visible ? null : "weak"}>{fractionDigits}</DiagnosticCell>
          </React.Fragment>
        )
      })}
    </DiagnosticsGrid>
  )
})

const DimensionSelector = withChartProvider(() => {
  const chart = useChart()
  const forceUpdate = useForceUpdate()

  useImmediateListener(
    () =>
      unregister(
        chart.on("payloadChanged", forceUpdate).on("visibleDimensionsChanged", forceUpdate),
        chart.onAttributeChange("selectedLegendDimensions", forceUpdate)
      ),
    [chart]
  )

  const ids = chart.getDimensionIds?.() || []
  const selected = chart.getAttribute("selectedLegendDimensions")

  if (!ids.length) return null

  return (
    <Flex gap={1} flexWrap>
      <Button
        active={!selected.length}
        onClick={() => chart.updateAttribute("selectedLegendDimensions", [])}
      >
        all
      </Button>
      {ids.map(id => (
        <Button
          key={id}
          active={selected.length === 1 && selected[0] === id}
          onClick={() => chart.updateAttribute("selectedLegendDimensions", [id])}
        >
          {chart.getDimensionName(id) || id}
        </Button>
      ))}
    </Flex>
  )
})

const ChartCase = ({ id, title, purpose, payload, selectedLegendDimensions, attributes }) => {
  const chart = useMemo(
    () => createChart({ id, payload, selectedLegendDimensions, attributes }),
    [id, payload, selectedLegendDimensions, attributes]
  )

  useEffect(() => () => chart.destroy(), [chart])

  return (
    <CaseShell>
      <CaseHeader>
        <TextSmall strong>{title}</TextSmall>
        <TextMicro color="textDescription">{purpose}</TextMicro>
        <DimensionSelector chart={chart} />
      </CaseHeader>
      <Flex padding={[0, 2]}>
        <Line chart={chart} height="260px" />
      </Flex>
      <Diagnostics chart={chart} />
    </CaseShell>
  )
}

const GiB = 1024 ** 3
const MiB = 1024 ** 2

const happyPathPayload = makePayload({
  title: "Happy path: bytes scale clearly",
  unit: "By",
  dimensions: [
    {
      id: "read",
      name: "read",
      values: [420 * MiB, 610 * MiB, 760 * MiB, 1.1 * GiB, 1.45 * GiB, 1.7 * GiB],
    },
    {
      id: "write",
      name: "write",
      values: [180 * MiB, 260 * MiB, 330 * MiB, 390 * MiB, 520 * MiB, 650 * MiB],
    },
  ],
})

const tinyBytesPayload = makePayload({
  title: "Edge case: tiny byte values hidden by a GiB dimension",
  unit: "By",
  dimensions: [
    {
      id: "tiny",
      name: "tiny bytes",
      values: [32, 48, 64, 96, 128, 64],
    },
    {
      id: "small",
      name: "small KiB",
      values: [8 * 1024, 12 * 1024, 16 * 1024, 24 * 1024, 18 * 1024, 10 * 1024],
    },
    {
      id: "large",
      name: "large GiB",
      values: [0.8 * GiB, 0.95 * GiB, 1.1 * GiB, 1.25 * GiB, 1.4 * GiB, 1.6 * GiB],
    },
  ],
})

const borderlinePayload = makePayload({
  title: "Edge case: one value barely crosses 1000",
  unit: "requests/s",
  dimensions: [
    {
      id: "normal",
      name: "normal range",
      values: [820, 890, 940, 972, 988, 999],
    },
    {
      id: "barely-over",
      name: "barely over",
      values: [910, 960, 1004, 1080, 1160, 1234],
    },
  ],
})

const secondsPayload = makePayload({
  title: "Edge case: seconds across ns/us/ms/s/h magnitudes",
  unit: "s",
  dimensions: [
    {
      id: "ns",
      name: "nanoseconds",
      values: [25e-9, 30e-9, 35e-9, 40e-9, 45e-9, 25e-9],
    },
    {
      id: "us",
      name: "microseconds",
      values: [5e-6, 7e-6, 9e-6, 11e-6, 13e-6, 5e-6],
    },
    {
      id: "ms",
      name: "milliseconds",
      values: [0.03, 0.05, 0.07, 0.09, 0.11, 0.03],
    },
    {
      id: "sec",
      name: "seconds",
      values: [4, 5, 6, 7, 8, 5],
    },
    {
      id: "hours",
      name: "hours",
      values: [8 * 3600, 8.5 * 3600, 9 * 3600, 9.5 * 3600, 10 * 3600, 10 * 3600],
    },
  ],
})

const mixedUnitsPayload = makePayload({
  title: "Edge case: dimensions have different base units",
  unit: ["By", "s"],
  dimensions: [
    {
      id: "bytes",
      name: "storage",
      unit: "By",
      values: [220 * MiB, 360 * MiB, 480 * MiB, 740 * MiB, 1.1 * GiB, 1.4 * GiB],
    },
    {
      id: "latency",
      name: "latency",
      unit: "s",
      values: [0.006, 0.009, 0.015, 0.023, 0.031, 0.04],
    },
  ],
})

const cases = [
  {
    id: "units-happy-path",
    title: "Happy path",
    purpose: "Large byte values scale to a useful binary unit.",
    payload: happyPathPayload,
  },
  {
    id: "units-fraction-loss",
    title: "Fractional detail loss",
    purpose: "Tiny byte values are formatted through the same GiB scale as the large dimension.",
    payload: tinyBytesPayload,
  },
  {
    id: "units-selected-small",
    title: "Selected small dimension",
    purpose: "Same data as above, starting with only the tiny dimension visible.",
    payload: tinyBytesPayload,
    selectedLegendDimensions: ["tiny"],
  },
  {
    id: "units-borderline-thousand",
    title: "Borderline 1000 threshold",
    purpose: "One value over 1000 forces K scaling for the whole chart.",
    payload: borderlinePayload,
  },
  {
    id: "units-seconds-mixed-magnitude",
    title: "Time magnitudes",
    purpose: "Seconds data spans ns/us/ms/s/h magnitudes with one chart-level time format.",
    payload: secondsPayload,
  },
  {
    id: "units-mixed-base-units",
    title: "Mixed base units",
    purpose: "Dimensions carry different base units while sharing the same y-axis surface.",
    payload: mixedUnitsPayload,
  },
]

export const Overview = () => (
  <ThemeProvider theme={DefaultTheme}>
    <Page>
      {cases.map(item => (
        <ChartCase key={item.id} {...item} />
      ))}
    </Page>
  </ThemeProvider>
)

export const FractionalDetailLoss = () => (
  <ThemeProvider theme={DefaultTheme}>
    <Page>
      <ChartCase
        id="units-fraction-loss-single"
        title="Fractional detail loss"
        purpose="Tiny byte values are formatted through the same GiB scale as the large dimension."
        payload={tinyBytesPayload}
      />
    </Page>
  </ThemeProvider>
)

export const BorderlineThousands = () => (
  <ThemeProvider theme={DefaultTheme}>
    <Page>
      <ChartCase
        id="units-borderline-thousand-single"
        title="Borderline 1000 threshold"
        purpose="One value over 1000 forces K scaling for the whole chart."
        payload={borderlinePayload}
      />
    </Page>
  </ThemeProvider>
)

export const TimeMagnitudes = () => (
  <ThemeProvider theme={DefaultTheme}>
    <Page>
      <ChartCase
        id="units-seconds-mixed-magnitude-single"
        title="Time magnitudes"
        purpose="Seconds data spans ns/us/ms/s/h magnitudes with one chart-level time format."
        payload={secondsPayload}
      />
    </Page>
  </ThemeProvider>
)

export default {
  title: "Charts/Units scaling",
}
