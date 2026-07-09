import React, { useEffect, useMemo } from "react"
import styled from "styled-components"
import { Flex, TextMicro, TextSmall } from "@netdata/netdata-ui"
import Status from "@/components/status"
import Fullscreen from "@/components/toolbox/fullscreen"
import Settings from "@/components/toolbox/settings"
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
const storyPoints = 97
const spikeSeconds = 15 * 60

const Page = styled(Flex).attrs({
  column: true,
  gap: 4,
  padding: [4],
})`
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  max-width: 1440px;

  && [data-testid="chartHeaderStatus-title"] > span:first-child {
    color: ${({ theme }) => theme.colors.text};
    font-weight: 700;
  }
`

const CloudCaseShell = styled(Flex).attrs({
  column: true,
  gap: 2,
})`
  min-width: 0;
  width: 100%;
`

const CloudCaseHeader = styled(Flex).attrs({
  column: true,
  gap: 1,
})``

const CaseTitle = styled(TextSmall).attrs({
  color: "text",
  strong: true,
})`
  font-weight: 700;
`

const CloudCardSurface = styled(Flex).attrs(({ height }) => ({
  column: true,
  width: "100%",
  height,
  background: "tableRowBg",
  position: "relative",
  round: true,
}))`
  box-sizing: border-box;
  min-width: 0;
`

const CaseShell = styled(Flex).attrs({
  column: true,
  gap: 2,
})`
  border: 1px solid #dbe1e1;
  border-radius: 6px;
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

const clamp = value => Math.min(1, Math.max(0, value))

const makeRandom = seed => {
  let state = seed >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

const makeAnomalySeed = (dimension, index) =>
  String(dimension.id || dimension.name || index)
    .split("")
    .reduce((seed, char) => (seed * 31 + char.charCodeAt(0)) >>> 0, 2166136261 + index)

const makeRareAnomalyRates = ({ points, seed, chance = 0.015, min = 20, max = 100 }) => {
  const random = makeRandom(seed)
  const rates = Array.from({ length: points }, () =>
    random() < chance ? min + random() * (max - min) : 0
  )

  if (points && !rates.some(Boolean)) {
    const index = Math.floor(random() * points)
    rates[index] = min + random() * (max - min)
  }

  return rates
}

const addRareAnomalies = dimensions =>
  dimensions.map((dimension, index) => {
    const points = dimension.values.length
    const rareRates = makeRareAnomalyRates({
      points,
      seed: makeAnomalySeed(dimension, index),
    })

    return {
      ...dimension,
      anomalyRates: Array.from({ length: points }, (_, pointIndex) => {
        const existingRate =
          dimension.anomalyRates?.[pointIndex % dimension.anomalyRates.length] || 0
        return Math.max(existingRate, rareRates[pointIndex])
      }),
    }
  })

const makeNoisySeries = ({ min, max, seed, points = storyPoints, cycles = 2.4, jitter = 0.12 }) => {
  const random = makeRandom(seed)
  const span = max - min
  let drift = 0.5 + (random() - 0.5) * 0.2

  return Array.from({ length: points }, (_, index) => {
    const progress = points === 1 ? 0 : index / (points - 1)
    const primary = (Math.sin(progress * Math.PI * 2 * cycles + seed) + 1) / 2
    const secondary = (Math.sin(progress * Math.PI * 2 * (cycles * 0.43) + seed * 0.37) + 1) / 2
    drift = clamp(drift + (random() - 0.5) * 0.08)

    const normalized = clamp(
      primary * 0.52 + secondary * 0.28 + drift * 0.2 + (random() - 0.5) * jitter
    )

    return min + normalized * span
  })
}

const makeSingleSpikeSeries = ({ min, max, spike, spikeIndex, points, seed }) =>
  makeNoisySeries({ min, max, seed, points, cycles: 4.5, jitter: 0.08 }).map((value, index) =>
    index === spikeIndex ? spike : value
  )

const makePrecisionPayload = ({ digits, min, max, seed }) =>
  makePayload({
    title: `${digits} fractional digits needed on the y-axis`,
    unit: "%",
    dimensions: [
      {
        id: `precision-${digits}`,
        name: `${digits} fractional digits`,
        values: makeNoisySeries({
          min,
          max,
          seed,
          cycles: 3.2,
          jitter: 0.04,
        }),
      },
    ],
  })

const makeDimensionStats = dimensions =>
  dimensions.reduce(
    (stats, dimension) => {
      const { min, max, avg } = range(dimension.values)
      const anomalyRates = dimension.anomalyRates || []
      stats.min.push(min)
      stats.max.push(max)
      stats.avg.push(avg)
      stats.arp.push(anomalyRates.length ? range(anomalyRates).avg : 0)
      stats.con.push(0)
      return stats
    },
    { min: [], max: [], avg: [], arp: [], con: [] }
  )

const makeRows = (dimensions, every = updateEvery) => {
  const points = Math.max(...dimensions.map(dimension => dimension.values.length))
  return Array.from({ length: points }, (_, index) => [
    now - (points - index - 1) * every * 1000,
    ...dimensions.map(dimension => [
      dimension.values[index % dimension.values.length],
      dimension.anomalyRates?.[index % dimension.anomalyRates.length] || 0,
      dimension.annotations?.[index % dimension.annotations.length] || 0,
    ]),
  ])
}

const makePayload = ({ title, unit, dimensions, updateEvery: every = updateEvery }) => {
  const dimensionsWithAnomalies = addRareAnomalies(dimensions)
  const rows = makeRows(dimensionsWithAnomalies, every)
  const values = dimensionsWithAnomalies.flatMap(dimension => dimension.values)
  const { min, max, avg } = range(values)
  const dimensionStats = makeDimensionStats(dimensionsWithAnomalies)
  const units = Array.isArray(unit)
    ? unit
    : [...new Set(dimensionsWithAnomalies.map(dimension => dimension.unit || unit))]
  const ids = dimensionsWithAnomalies.map(dimension => dimension.id)
  const names = dimensionsWithAnomalies.map(dimension => dimension.name || dimension.id)
  const dimensionUnits = dimensionsWithAnomalies.map(dimension => dimension.unit || unit)

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
      dimensions: dimensionsWithAnomalies.map((dimension, index) => ({
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
      update_every: every,
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
      update_every: every,
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

const cloudToolboxElements = [Settings, Fullscreen]

const cloudRootAttributes = {
  contextScope: ["storybook.units_scaling"],
  containerWidth: 1180,
  theme: "dark",
  designFlavour: "default",
  filterToolboxMode: "fixed",
  navigation: "pan",
  overlays: { proceeded: { type: "proceeded" } },
  expandable: false,
}

const createCloudChart = ({
  id,
  payload,
  selectedLegendDimensions = [],
  rootAttributes = {},
  attributes = {},
}) => {
  const sdk = makeDefaultSDK({
    attributes: {
      ...cloudRootAttributes,
      ...rootAttributes,
    },
  })
  const chart = sdk.makeChart({
    getChart: makeMockPayload(payload),
    attributes: {
      id,
      chartLibrary: "dygraph",
      contextScope: ["storybook.units_scaling"],
      leftHeaderElements: [Status],
      toolboxElements: cloudToolboxElements,
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
            "unitsByDimension",
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
        const unitAttributes = chart.getUnitAttributesForValue(raw, { dimensionId: id })
        const { prefix, base, fractionDigits } = unitAttributes
        const stats = payload.byDimension?.[id] || {}
        const visible = chart.isDimensionVisible(id)

        return (
          <React.Fragment key={id}>
            <DiagnosticCell opacity={visible ? null : "weak"}>
              {chart.getDimensionName(id) || id}
            </DiagnosticCell>
            <DiagnosticCell opacity={visible ? null : "weak"}>{formatRaw(raw)}</DiagnosticCell>
            <DiagnosticCell opacity={visible ? null : "weak"}>
              {chart.getConvertedValue(raw, { dimensionId: id, unitAttributes })}
            </DiagnosticCell>
            <DiagnosticCell opacity={visible ? null : "weak"}>
              {chart.getUnitSign({ dimensionId: id, unitAttributes }) || "-"}
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
        <CaseTitle>{title}</CaseTitle>
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

const CloudChartCase = ({
  id,
  title,
  purpose,
  payload,
  selectedLegendDimensions,
  rootAttributes,
  attributes,
  height = "360px",
  lineProps = {},
}) => {
  const chart = useMemo(
    () => createCloudChart({ id, payload, selectedLegendDimensions, rootAttributes, attributes }),
    [id, payload, selectedLegendDimensions, rootAttributes, attributes]
  )

  useEffect(() => () => chart.destroy(), [chart])

  return (
    <CloudCaseShell>
      <CloudCaseHeader>
        <CaseTitle>{title}</CaseTitle>
        <TextMicro color="textDescription">{purpose}</TextMicro>
      </CloudCaseHeader>
      <CloudCardSurface height={height}>
        <Line chart={chart} height={height} width="100%" {...lineProps} />
      </CloudCardSurface>
    </CloudCaseShell>
  )
}

const GiB = 1024 ** 3
const MiB = 1024 ** 2
const KiB = 1024

const makeUnitDisplayPayload = ({ title, unit, dimensions }) =>
  makePayload({
    title,
    unit,
    dimensions: dimensions.map(({ id, name, min, max, seed, cycles = 3.2, jitter = 0.08 }) => ({
      id,
      name,
      values: makeNoisySeries({ min, max, seed, cycles, jitter }),
    })),
  })

const unitDisplayCaseDefinitions = [
  {
    id: "source-kib",
    title: "Source unit: KiB",
    purpose:
      "Raw values are already in KiB; chart units normalize to bytes while labels move down to B or up to MiB/GiB.",
    unit: "KiB",
    dimensions: [
      { id: "kib-subunit", name: "fractional KiB", min: 0.04, max: 0.82, seed: 171 },
      { id: "kib-middle", name: "tens of KiB", min: 18, max: 92, seed: 173 },
      { id: "kib-large", name: "many KiB", min: 2400, max: 12200, seed: 179 },
    ],
  },
  {
    id: "source-kib-per-operation",
    title: "Source unit: KiB/operation",
    purpose:
      "Raw values are already in KiB/operation; chart units normalize to bytes per operation without double-prefix labels.",
    unit: "KiB/operation",
    dimensions: [
      { id: "kibop-small", name: "fractional KiB/operation", min: 0.04, max: 0.86, seed: 347 },
      { id: "kibop-middle", name: "tens of KiB/operation", min: 18, max: 92, seed: 349 },
      { id: "kibop-large", name: "many KiB/operation", min: 2400, max: 12200, seed: 353 },
    ],
  },
  {
    id: "source-kb",
    title: "Source unit: KB",
    purpose:
      "Agent KB values are treated as byte-scale source values and chart units normalize to bytes.",
    unit: "KB",
    dimensions: [
      { id: "kb-small", name: "fractional KB", min: 0.04, max: 0.82, seed: 677 },
      { id: "kb-middle", name: "tens of KB", min: 18, max: 92, seed: 683 },
      { id: "kb-large", name: "many KB", min: 2400, max: 12200, seed: 691 },
    ],
  },
  {
    id: "source-mib",
    title: "Source unit: MiB",
    purpose:
      "Raw values are already in MiB; chart units normalize to bytes and labels can move down to KiB or up to GiB/TiB.",
    unit: "MiB",
    dimensions: [
      { id: "mib-small", name: "fractional MiB", min: 0.02, max: 0.86, seed: 701 },
      { id: "mib-middle", name: "several MiB", min: 2.5, max: 24, seed: 709 },
      { id: "mib-large", name: "many MiB", min: 1200, max: 6800, seed: 719 },
    ],
  },
  {
    id: "source-mb",
    title: "Source unit: MB",
    purpose:
      "Agent MB values are treated as byte-scale source values and chart units normalize to bytes.",
    unit: "MB",
    dimensions: [
      { id: "mb-small", name: "fractional MB", min: 0.02, max: 0.86, seed: 727 },
      { id: "mb-middle", name: "several MB", min: 2.5, max: 24, seed: 733 },
      { id: "mb-large", name: "many MB", min: 1200, max: 6800, seed: 739 },
    ],
  },
  {
    id: "source-gib",
    title: "Source unit: GiB",
    purpose:
      "Raw values are already in GiB; chart units normalize to bytes and labels can move down to MiB or up to TiB.",
    unit: "GiB",
    dimensions: [
      { id: "gib-small", name: "fractional GiB", min: 0.02, max: 0.86, seed: 359 },
      { id: "gib-middle", name: "several GiB", min: 2.5, max: 24, seed: 367 },
      { id: "gib-large", name: "many GiB", min: 1200, max: 6800, seed: 373 },
    ],
  },
  {
    id: "source-gigabytes",
    title: "Source unit: gigabytes",
    purpose:
      "Long-form gigabytes are normalized through the same byte-scale path as GiB.",
    unit: "gigabytes",
    dimensions: [
      { id: "gigabytes-small", name: "fractional gigabytes", min: 0.04, max: 0.92, seed: 379 },
      { id: "gigabytes-middle", name: "several gigabytes", min: 3, max: 32, seed: 383 },
      { id: "gigabytes-large", name: "many gigabytes", min: 1800, max: 9200, seed: 389 },
    ],
  },
  {
    id: "source-bytes",
    title: "Source unit: bytes",
    purpose: "Raw byte values span B/KiB/MiB/GiB labels.",
    unit: "bytes",
    dimensions: [
      { id: "bytes-small", name: "raw bytes", min: 18, max: 840, seed: 181 },
      { id: "bytes-middle", name: "KiB-sized bytes", min: 8 * KiB, max: 96 * KiB, seed: 191 },
      { id: "bytes-large", name: "GiB-sized bytes", min: 0.8 * GiB, max: 4.6 * GiB, seed: 193 },
    ],
  },
  {
    id: "source-kbps-literal",
    title: "Source unit: kbps",
    purpose:
      "Literal kbps is not an alias today, so it is treated as a generic scalable unit and shows scale-only suffixes.",
    unit: "kbps",
    dimensions: [
      { id: "kbps-literal-small", name: "literal small kbps", min: 0.4, max: 4.5, seed: 197 },
      { id: "kbps-literal-middle", name: "literal thousands", min: 900, max: 1800, seed: 199 },
      { id: "kbps-literal-large", name: "literal millions", min: 1.2e6, max: 8.8e6, seed: 211 },
    ],
  },
  {
    id: "source-kilobits-per-second",
    title: "Source unit: kilobits/s",
    purpose:
      "Supported kbps-style bit rate; chart units normalize to bits per second while labels scale as bit/s, kbit/s, Mbit/s, or Gbit/s.",
    unit: "kilobits/s",
    dimensions: [
      { id: "kbits-small", name: "sub-kilobit rate", min: 0.08, max: 0.92, seed: 223 },
      { id: "kbits-middle", name: "kilobit rate", min: 48, max: 920, seed: 227 },
      { id: "kbits-large", name: "gigabit-scale rate", min: 1.4e6, max: 7.2e6, seed: 229 },
    ],
  },
  {
    id: "source-kilobits",
    title: "Source unit: kilobits",
    purpose:
      "Raw values are already in kilobits; chart units normalize to bits and labels scale without double prefixes.",
    unit: "kilobits",
    dimensions: [
      { id: "kilobits-small", name: "fractional kilobits", min: 0.08, max: 0.92, seed: 743 },
      { id: "kilobits-middle", name: "kilobits", min: 48, max: 920, seed: 751 },
      { id: "kilobits-large", name: "gigabit-scale", min: 1.4e6, max: 7.2e6, seed: 757 },
    ],
  },
  {
    id: "source-mbps",
    title: "Source unit: Mbps",
    purpose:
      "Raw values are already in megabits per second; labels normalize to the bit/s scale.",
    unit: "Mbps",
    dimensions: [
      { id: "mbps-small", name: "fractional Mbps", min: 0.05, max: 0.96, seed: 397 },
      { id: "mbps-middle", name: "hundreds of Mbps", min: 28, max: 720, seed: 401 },
      { id: "mbps-large", name: "many Mbps", min: 18000, max: 94000, seed: 409 },
    ],
  },
  {
    id: "source-mhz",
    title: "Source unit: MHz",
    purpose:
      "Raw values are already in megahertz; chart units normalize to hertz and labels scale across Hz/kHz/MHz/GHz.",
    unit: "MHz",
    dimensions: [
      { id: "mhz-small", name: "fractional MHz", min: 0.03, max: 0.92, seed: 761 },
      { id: "mhz-middle", name: "hundreds of MHz", min: 160, max: 950, seed: 769 },
      { id: "mhz-large", name: "many MHz", min: 3200, max: 6800, seed: 773 },
    ],
  },
  {
    id: "source-seconds",
    title: "Source unit: seconds",
    purpose:
      "Seconds use duration-aware scaling, including compact duration values with no separate unit suffix.",
    unit: "seconds",
    dimensions: [
      { id: "seconds-ns", name: "nanosecond latency", min: 25e-9, max: 95e-9, seed: 233 },
      { id: "seconds-ms", name: "millisecond latency", min: 0.002, max: 0.018, seed: 239 },
      { id: "seconds-hours", name: "multi-hour duration", min: 2 * 3600, max: 11 * 3600, seed: 241 },
    ],
  },
  {
    id: "source-milliseconds",
    title: "Source unit: milliseconds",
    purpose:
      "Milliseconds normalize to seconds and still use duration-aware scaling, including sub-millisecond and hour-scale values.",
    unit: "milliseconds",
    dimensions: [
      { id: "milliseconds-us", name: "microsecond latency", min: 0.003, max: 0.08, seed: 243 },
      { id: "milliseconds-ms", name: "millisecond latency", min: 2, max: 18, seed: 247 },
      {
        id: "milliseconds-hours",
        name: "multi-hour duration",
        min: 2 * 3600 * 1000,
        max: 11 * 3600 * 1000,
        seed: 249,
      },
    ],
  },
  {
    id: "source-microseconds",
    title: "Source unit: microseconds",
    purpose:
      "Microseconds normalize to seconds and can scale down to ns or up to ms/s/duration labels.",
    unit: "microseconds",
    dimensions: [
      { id: "microseconds-ns", name: "sub-microsecond latency", min: 0.02, max: 0.86, seed: 419 },
      { id: "microseconds-us", name: "microsecond latency", min: 2, max: 180, seed: 421 },
      { id: "microseconds-ms", name: "millisecond latency", min: 2400, max: 18000, seed: 431 },
    ],
  },
  {
    id: "source-ms",
    title: "Source unit: ms",
    purpose:
      "Short-form ms follows the same normalized seconds path as milliseconds.",
    unit: "ms",
    dimensions: [
      { id: "ms-us", name: "microsecond latency", min: 0.003, max: 0.08, seed: 787 },
      { id: "ms-ms", name: "millisecond latency", min: 2, max: 18, seed: 797 },
      { id: "ms-hours", name: "multi-hour duration", min: 2 * 3600 * 1000, max: 11 * 3600 * 1000, seed: 809 },
    ],
  },
  {
    id: "source-us",
    title: "Source unit: us",
    purpose:
      "Short-form us follows the same normalized seconds path as microseconds.",
    unit: "us",
    dimensions: [
      { id: "us-ns", name: "sub-microsecond latency", min: 0.02, max: 0.86, seed: 811 },
      { id: "us-us", name: "microsecond latency", min: 2, max: 180, seed: 821 },
      { id: "us-ms", name: "millisecond latency", min: 2400, max: 18000, seed: 823 },
    ],
  },
  {
    id: "source-ms-request",
    title: "Source unit: milliseconds/request",
    purpose:
      "Per-request latency keeps the denominator while normalizing the scale to seconds per request.",
    unit: "milliseconds/request",
    dimensions: [
      { id: "msreq-us", name: "microseconds per request", min: 0.004, max: 0.08, seed: 433 },
      { id: "msreq-ms", name: "milliseconds per request", min: 2, max: 18, seed: 439 },
      { id: "msreq-s", name: "seconds per request", min: 2800, max: 12800, seed: 443 },
    ],
  },
  {
    id: "source-ms-operation",
    title: "Source unit: milliseconds/operation",
    purpose:
      "Per-operation latency keeps the denominator while normalizing the scale to seconds per operation.",
    unit: "milliseconds/operation",
    dimensions: [
      { id: "msop-us", name: "microseconds per operation", min: 0.004, max: 0.08, seed: 449 },
      { id: "msop-ms", name: "milliseconds per operation", min: 2, max: 18, seed: 457 },
      { id: "msop-s", name: "seconds per operation", min: 2800, max: 12800, seed: 461 },
    ],
  },
  {
    id: "source-ms-run",
    title: "Source unit: milliseconds/run",
    purpose:
      "Per-run latency keeps the denominator while normalizing the scale to seconds per run.",
    unit: "milliseconds/run",
    dimensions: [
      { id: "msrun-us", name: "microseconds per run", min: 0.004, max: 0.08, seed: 463 },
      { id: "msrun-ms", name: "milliseconds per run", min: 2, max: 18, seed: 467 },
      { id: "msrun-s", name: "seconds per run", min: 2800, max: 12800, seed: 479 },
    ],
  },
  {
    id: "source-milliseconds-per-second",
    title: "Source unit: milliseconds/s",
    purpose:
      "Milliseconds per second normalize to seconds per second and scale without repeating the source prefix.",
    unit: "milliseconds/s",
    dimensions: [
      { id: "mss-small", name: "fractional ms/s", min: 0.02, max: 0.86, seed: 487 },
      { id: "mss-middle", name: "hundreds of ms/s", min: 24, max: 820, seed: 491 },
      { id: "mss-large", name: "many ms/s", min: 2400, max: 18000, seed: 499 },
    ],
  },
  {
    id: "source-ms-per-second",
    title: "Source unit: ms/s",
    purpose:
      "Short-form ms/s follows the same normalized seconds-per-second path as milliseconds/s.",
    unit: "ms/s",
    dimensions: [
      { id: "mss-short-small", name: "fractional ms/s", min: 0.02, max: 0.86, seed: 827 },
      { id: "mss-short-middle", name: "hundreds of ms/s", min: 24, max: 820, seed: 829 },
      { id: "mss-short-large", name: "many ms/s", min: 2400, max: 18000, seed: 839 },
    ],
  },
  {
    id: "source-microseconds-per-second",
    title: "Source unit: microseconds/s",
    purpose:
      "Microseconds per second normalize to seconds per second and can scale across micro/milli/whole seconds per second.",
    unit: "microseconds/s",
    dimensions: [
      { id: "uss-small", name: "fractional µs/s", min: 0.02, max: 0.86, seed: 503 },
      { id: "uss-middle", name: "hundreds of µs/s", min: 24, max: 820, seed: 509 },
      { id: "uss-large", name: "many µs/s", min: 2400, max: 18000, seed: 521 },
    ],
  },
  {
    id: "source-microseconds-lost-per-second",
    title: "Source unit: microseconds lost/s",
    purpose:
      "Agent text alias for microseconds per second follows the same normalized seconds-per-second path.",
    unit: "microseconds lost/s",
    dimensions: [
      { id: "uslost-small", name: "fractional lost µs/s", min: 0.02, max: 0.86, seed: 523 },
      { id: "uslost-middle", name: "hundreds lost µs/s", min: 24, max: 820, seed: 541 },
      { id: "uslost-large", name: "many lost µs/s", min: 2400, max: 18000, seed: 547 },
    ],
  },
  {
    id: "source-usec-per-second",
    title: "Source unit: usec/s",
    purpose:
      "Legacy usec/s follows the same normalized seconds-per-second path as microseconds/s.",
    unit: "usec/s",
    dimensions: [
      { id: "usecs-small", name: "fractional usec/s", min: 0.02, max: 0.86, seed: 853 },
      { id: "usecs-middle", name: "hundreds of usec/s", min: 24, max: 820, seed: 857 },
      { id: "usecs-large", name: "many usec/s", min: 2400, max: 18000, seed: 859 },
    ],
  },
  {
    id: "source-percent",
    title: "Source unit: percent",
    purpose: "Percent is non-scalable, so labels keep percent even for tiny fractional values.",
    unit: "percent",
    dimensions: [
      { id: "percent-tiny", name: "tiny percentage", min: 0.00012, max: 0.00092, seed: 251 },
      { id: "percent-middle", name: "middle percentage", min: 34, max: 68, seed: 257 },
      { id: "percent-high", name: "high percentage", min: 96.2, max: 99.95, seed: 263 },
    ],
  },
  {
    id: "source-requests-per-second",
    title: "Source unit: requests/s",
    purpose:
      "Request rates use scale-only labels, so k/M/G are shown without repeating requests/s.",
    unit: "requests/s",
    dimensions: [
      { id: "requests-small", name: "few requests", min: 0.2, max: 8, seed: 269 },
      { id: "requests-middle", name: "borderline requests", min: 840, max: 1600, seed: 271 },
      { id: "requests-large", name: "millions of requests", min: 1.4e6, max: 7.8e6, seed: 277 },
    ],
  },
  {
    id: "source-operations-per-second",
    title: "Source unit: operations/s",
    purpose:
      "Operations per second are generic scalable rates; legend and popover show only the scale designator.",
    unit: "operations/s",
    dimensions: [
      { id: "operations-small", name: "few operations", min: 12, max: 95, seed: 281 },
      { id: "operations-middle", name: "thousands of operations", min: 12000, max: 88000, seed: 283 },
      { id: "operations-large", name: "billions of operations", min: 1.2e9, max: 8.4e9, seed: 293 },
    ],
  },
  {
    id: "source-kib-per-second",
    title: "Source unit: KiB/s",
    purpose:
      "Raw values are already in KiB/s; chart units normalize to bytes per second and labels can move down to B/s or up to MiB/s.",
    unit: "KiB/s",
    dimensions: [
      { id: "kibps-small", name: "fractional KiB/s", min: 0.05, max: 0.95, seed: 307 },
      { id: "kibps-middle", name: "hundreds of KiB/s", min: 24, max: 420, seed: 311 },
      { id: "kibps-large", name: "many KiB/s", min: 24000, max: 180000, seed: 313 },
    ],
  },
  {
    id: "source-kilobytes-per-second",
    title: "Source unit: kilobytes/s",
    purpose:
      "Long-form kilobytes per second follows the same normalized byte-rate path as KiB/s.",
    unit: "kilobytes/s",
    dimensions: [
      { id: "kilobytesps-small", name: "fractional kilobytes/s", min: 0.05, max: 0.95, seed: 557 },
      { id: "kilobytesps-middle", name: "hundreds of kilobytes/s", min: 24, max: 420, seed: 563 },
      { id: "kilobytesps-large", name: "many kilobytes/s", min: 24000, max: 180000, seed: 569 },
    ],
  },
  {
    id: "source-mib-per-second",
    title: "Source unit: MiB/s",
    purpose:
      "Raw values are already in MiB/s; chart units normalize to bytes per second and labels can move down to KiB/s or up to GiB/s.",
    unit: "MiB/s",
    dimensions: [
      { id: "mibps-small", name: "fractional MiB/s", min: 0.01, max: 0.86, seed: 317 },
      { id: "mibps-middle", name: "tens of MiB/s", min: 24, max: 128, seed: 331 },
      { id: "mibps-large", name: "many MiB/s", min: 2400, max: 14200, seed: 337 },
    ],
  },
  {
    id: "source-gib-per-second",
    title: "Source unit: GiB/s",
    purpose:
      "Raw values are already in GiB/s; chart units normalize to bytes per second and labels can move down or up from GiB/s.",
    unit: "GiB/s",
    dimensions: [
      { id: "gibps-small", name: "fractional GiB/s", min: 0.01, max: 0.86, seed: 571 },
      { id: "gibps-middle", name: "tens of GiB/s", min: 24, max: 128, seed: 577 },
      { id: "gibps-large", name: "many GiB/s", min: 2400, max: 14200, seed: 587 },
    ],
  },
  {
    id: "source-millicpu",
    title: "Source unit: millicpu",
    purpose:
      "Raw values are in milliCPU; chart units normalize to CPU and labels should not show duplicate milli prefixes.",
    unit: "millicpu",
    dimensions: [
      { id: "millicpu-small", name: "fractional CPU", min: 80, max: 950, seed: 593 },
      { id: "millicpu-middle", name: "several CPU", min: 1400, max: 8200, seed: 599 },
      { id: "millicpu-large", name: "many CPU", min: 24000, max: 94000, seed: 601 },
    ],
  },
  {
    id: "source-milliamps",
    title: "Source unit: milliamps",
    purpose:
      "Raw values are in milliamps; chart units normalize to amperes and labels scale from mA to A/kA.",
    unit: "milliamps",
    dimensions: [
      { id: "milliamps-small", name: "fractional amps", min: 20, max: 920, seed: 607 },
      { id: "milliamps-middle", name: "several amps", min: 1800, max: 12000, seed: 613 },
      { id: "milliamps-large", name: "many amps", min: 2.4e6, max: 8.4e6, seed: 617 },
    ],
  },
  {
    id: "source-millivolts",
    title: "Source unit: millivolts",
    purpose:
      "Raw values are in millivolts; chart units normalize to volts and labels scale from mV to V/kV.",
    unit: "millivolts",
    dimensions: [
      { id: "millivolts-small", name: "fractional volts", min: 20, max: 920, seed: 619 },
      { id: "millivolts-middle", name: "several volts", min: 1800, max: 12000, seed: 631 },
      { id: "millivolts-large", name: "many volts", min: 2.4e6, max: 8.4e6, seed: 641 },
    ],
  },
  {
    id: "source-millijoules-per-second",
    title: "Source unit: mJ/s",
    purpose:
      "Agent mJ/s values are normalized as milliwatts, then chart units normalize to watts.",
    unit: "mJ/s",
    dimensions: [
      { id: "mjps-small", name: "fractional watts", min: 20, max: 920, seed: 643 },
      { id: "mjps-middle", name: "several watts", min: 1800, max: 12000, seed: 647 },
      { id: "mjps-large", name: "many watts", min: 2.4e6, max: 8.4e6, seed: 653 },
    ],
  },
  {
    id: "source-dbm",
    title: "Source unit: dBm",
    purpose:
      "dBm is a logarithmic special unit, so it is not normalized to watts and should keep dBm labels.",
    unit: "dBm",
    dimensions: [
      { id: "dbm-weak", name: "weak signal", min: -92, max: -74, seed: 659 },
      { id: "dbm-mid", name: "medium signal", min: -68, max: -48, seed: 661 },
      { id: "dbm-strong", name: "strong signal", min: -44, max: -30, seed: 673 },
    ],
  },
]

const unitDisplayCases = unitDisplayCaseDefinitions.map(({ title, unit, dimensions, ...rest }) => ({
  ...rest,
  title,
  payload: makeUnitDisplayPayload({
    title,
    unit,
    dimensions,
  }),
}))

const happyPathPayload = makePayload({
  title: "Happy path: bytes scale clearly",
  unit: "By",
  dimensions: [
    {
      id: "read",
      name: "read",
      values: makeNoisySeries({
        min: 420 * MiB,
        max: 1.7 * GiB,
        seed: 11,
      }),
    },
    {
      id: "write",
      name: "write",
      values: makeNoisySeries({
        min: 180 * MiB,
        max: 650 * MiB,
        seed: 17,
      }),
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
      values: makeNoisySeries({
        min: 24,
        max: 152,
        seed: 23,
        jitter: 0.2,
      }),
    },
    {
      id: "small",
      name: "small KiB",
      values: makeNoisySeries({
        min: 8 * 1024,
        max: 26 * 1024,
        seed: 29,
      }),
    },
    {
      id: "large",
      name: "large GiB",
      values: makeNoisySeries({
        min: 0.8 * GiB,
        max: 1.6 * GiB,
        seed: 31,
      }),
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
      values: makeNoisySeries({
        min: 820,
        max: 999,
        seed: 37,
      }),
    },
    {
      id: "barely-over",
      name: "barely over",
      values: makeNoisySeries({
        min: 910,
        max: 1234,
        seed: 41,
      }),
    },
  ],
})

const fractionalYAxisPayload = makePayload({
  title: "Edge case: fractional y-axis digits after scaling",
  unit: "s",
  dimensions: [
    {
      id: "p50",
      name: "p50 latency",
      values: makeNoisySeries({
        min: 0.00112,
        max: 0.00186,
        seed: 83,
        jitter: 0.06,
      }),
    },
    {
      id: "p99",
      name: "p99 latency",
      values: makeNoisySeries({
        min: 0.00148,
        max: 0.00238,
        seed: 89,
        jitter: 0.06,
      }),
    },
  ],
})

const fractionalPrecisionCases = [
  {
    digits: 2,
    min: 50.12,
    max: 50.98,
    seed: 101,
  },
  {
    digits: 3,
    min: 5.001,
    max: 5.009,
    seed: 103,
  },
  {
    digits: 4,
    min: 1.0001,
    max: 1.0009,
    seed: 107,
  },
  {
    digits: 5,
    min: 0.01001,
    max: 0.01009,
    seed: 109,
  },
  {
    digits: 6,
    min: 0.001001,
    max: 0.001009,
    seed: 113,
  },
  {
    digits: 7,
    min: 0.0001001,
    max: 0.0001009,
    seed: 127,
  },
].map(config => ({
  ...config,
  payload: makePrecisionPayload(config),
}))

const disproportionateSpikeIndex = Math.floor(spikeSeconds * 0.58)

const disproportionateSpikePayload = makePayload({
  title: "Edge case: one-second disproportionate spike",
  unit: "operations/s",
  updateEvery: 1,
  dimensions: [
    {
      id: "steady-2k",
      name: "steady ~2k",
      values: makeNoisySeries({
        min: 1800,
        max: 2200,
        seed: 73,
        points: spikeSeconds + 1,
        cycles: 8,
        jitter: 0.08,
      }),
    },
    {
      id: "spiky-100",
      name: "~100 with 1s spike",
      values: makeSingleSpikeSeries({
        min: 85,
        max: 115,
        spike: 10000000,
        spikeIndex: disproportionateSpikeIndex,
        points: spikeSeconds + 1,
        seed: 79,
      }),
      anomalyRates: Array.from({ length: spikeSeconds + 1 }, (_, index) =>
        index === disproportionateSpikeIndex ? 100 : 0
      ),
    },
  ],
})

const secondsPayload = makePayload({
  title: "Edge case: seconds across ns/µs/ms/s/m/h/d/w/mo/y magnitudes",
  unit: "s",
  dimensions: [
    {
      id: "ns",
      name: "nanoseconds",
      values: makeNoisySeries({
        min: 25e-9,
        max: 45e-9,
        seed: 43,
      }),
    },
    {
      id: "us",
      name: "microseconds",
      values: makeNoisySeries({
        min: 5e-6,
        max: 13e-6,
        seed: 47,
      }),
    },
    {
      id: "ms",
      name: "milliseconds",
      values: makeNoisySeries({
        min: 0.03,
        max: 0.11,
        seed: 53,
      }),
    },
    {
      id: "sec",
      name: "seconds",
      values: makeNoisySeries({
        min: 4,
        max: 8,
        seed: 59,
      }),
    },
    {
      id: "min",
      name: "minutes",
      values: makeNoisySeries({
        min: 4 * 60,
        max: 8 * 60,
        seed: 62,
      }),
    },
    {
      id: "hours",
      name: "hours",
      values: makeNoisySeries({
        min: 8 * 3600,
        max: 10 * 3600,
        seed: 61,
      }),
    },
    {
      id: "days",
      name: "days",
      values: makeNoisySeries({
        min: 2 * 86400,
        max: 4 * 86400,
        seed: 64,
      }),
    },
    {
      id: "weeks",
      name: "weeks",
      values: makeNoisySeries({
        min: 2 * 7 * 86400,
        max: 4 * 7 * 86400,
        seed: 65,
      }),
    },
    {
      id: "months",
      name: "months",
      values: makeNoisySeries({
        min: 2 * 30 * 86400,
        max: 4 * 30 * 86400,
        seed: 66,
      }),
    },
    {
      id: "years",
      name: "years",
      values: makeNoisySeries({
        min: 1.2 * 365 * 86400,
        max: 1.8 * 365 * 86400,
        seed: 68,
      }),
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
      values: makeNoisySeries({
        min: 220 * MiB,
        max: 1.4 * GiB,
        seed: 67,
      }),
    },
    {
      id: "latency",
      name: "latency",
      unit: "s",
      values: makeNoisySeries({
        min: 0.006,
        max: 0.04,
        seed: 71,
      }),
    },
  ],
})

const longDimensionNamesPayload = makePayload({
  title: "Edge case: extremely long dimension names",
  unit: "operations/s",
  dimensions: [
    {
      id: "customer-facing-api-gateway-primary-region-status-2xx",
      name:
        "customer-facing-api-gateway.primary.us-east-1.kubernetes.namespace.observability.status_2xx.requests.rate",
      values: makeNoisySeries({
        min: 1800,
        max: 3200,
        seed: 131,
      }),
    },
    {
      id: "customer-facing-api-gateway-primary-region-status-5xx",
      name:
        "customer-facing-api-gateway.primary.us-east-1.kubernetes.namespace.observability.status_5xx.requests.rate",
      values: makeNoisySeries({
        min: 12,
        max: 180,
        seed: 137,
      }),
    },
    {
      id: "postgresql-wal-archive-replication-slot-long-label",
      name:
        "postgresql.cluster.prod-main.replication.slot.analytics_exporter.logical_decoding.wal_archive_lag.bytes_per_second",
      values: makeNoisySeries({
        min: 620,
        max: 1840,
        seed: 139,
      }),
    },
    {
      id: "network-interface-container-overlay-long-label",
      name:
        "node.worker-17.interface.veth9f7e8d6a.container.checkout-service.pod.payments.namespace.egress.packets_per_second",
      values: makeNoisySeries({
        min: 420,
        max: 960,
        seed: 149,
      }),
    },
  ],
})

const veryBigValuesPayload = makePayload({
  title: "Edge case: very big raw values",
  unit: "raw-events",
  dimensions: [
    {
      id: "huge-counter-a",
      name: "huge raw counter A",
      values: makeNoisySeries({
        min: 1.2e80,
        max: 3.8e80,
        seed: 151,
        jitter: 0.04,
      }),
    },
    {
      id: "huge-counter-b",
      name: "huge raw counter B",
      values: makeNoisySeries({
        min: 4.4e96,
        max: 8.8e96,
        seed: 157,
        jitter: 0.04,
      }),
    },
    {
      id: "huge-counter-c",
      name: "huge raw counter C",
      values: makeNoisySeries({
        min: 2.1e120,
        max: 7.6e120,
        seed: 163,
        jitter: 0.04,
      }),
    },
  ],
})

const cases = [
  {
    id: "units-happy-path",
    title: "Happy path",
    purpose: "Large byte values scale to a useful binary unit.",
    payload: happyPathPayload,
    attributes: {
      valueRange: [null, 1.85 * GiB],
    },
  },
  {
    id: "units-fraction-loss",
    title: "Tiny byte detail",
    purpose: "Tiny byte values keep byte-scale labels while the large dimension uses GiB.",
    payload: tinyBytesPayload,
  },
  {
    id: "units-selected-small",
    title: "Selected small dimension",
    purpose:
      "Same data as above, starting with only the tiny dimension visible on a byte-scale y-axis.",
    payload: tinyBytesPayload,
    selectedLegendDimensions: ["tiny"],
  },
  {
    id: "units-borderline-thousand",
    title: "Borderline 1000 threshold",
    purpose: "Request rates use scale-only labels, so K is shown without repeating requests/s.",
    payload: borderlinePayload,
  },
  {
    id: "units-fractional-y-axis-digits",
    title: "Fractional y-axis digits",
    purpose:
      "Latency values around 1-2ms need fractional y-axis labels after scaling from seconds.",
    payload: fractionalYAxisPayload,
  },
  {
    id: "units-disproportionate-spike",
    title: "Disproportionate one-second spike",
    purpose:
      "One dimension stays near 2k operations/s while another stays near 100 and spikes to 10M for one second.",
    payload: disproportionateSpikePayload,
  },
  {
    id: "units-seconds-mixed-magnitude",
    title: "Time magnitudes",
    purpose:
      "Seconds data spans ns/µs/ms/s/m/h/d/w/mo/y magnitudes with local labels per tick and dimension.",
    payload: secondsPayload,
  },
  {
    id: "units-mixed-base-units",
    title: "Mixed base units",
    purpose:
      "Dimensions carry different base units; dimension values stay local while the shared y-axis remains ambiguous.",
    payload: mixedUnitsPayload,
  },
  {
    id: "units-long-dimension-names",
    title: "Long dimension names",
    purpose:
      "Dimension names can be very long; legend and popover should truncate predictably without shrinking the value columns.",
    payload: longDimensionNamesPayload,
  },
  {
    id: "units-very-big-values",
    title: "Very big values",
    purpose:
      "Raw values can become hundreds of digits long; this exposes where exponential notation would be better.",
    payload: veryBigValuesPayload,
  },
]

const cloudRoomOverviewAttributes = {
  expandable: true,
  expanded: false,
  isHead: true,
  hasToolbox: true,
}

const cloudRoomOverviewRootAttributes = {
  composite: true,
  hasCorrelation: true,
  host: "storybook",
  versions: {},
}

const cloudCases = [
  {
    id: "cloud-room-overview-disproportionate-spike",
    title: "Cloud room overview",
    purpose:
      "Matches the room overview grid surface: normal header, fixed filters, footer, legend, popover, and collapsed expander.",
    payload: disproportionateSpikePayload,
    attributes: cloudRoomOverviewAttributes,
    rootAttributes: cloudRoomOverviewRootAttributes,
    height: "360px",
  },
  {
    id: "cloud-room-overview-disproportionate-spike-expanded",
    title: "Cloud room overview, expanded",
    purpose:
      "Same room overview chart after the production expander opens the real chart values drawer.",
    payload: disproportionateSpikePayload,
    attributes: {
      ...cloudRoomOverviewAttributes,
      expanded: true,
      expandedHeight: 280,
      drawer: {
        action: "values",
        tab: "window",
        showAdvancedStats: false,
      },
    },
    rootAttributes: cloudRoomOverviewRootAttributes,
    height: "660px",
  },
  {
    id: "cloud-dashboard-card-view-disproportionate-spike",
    title: "Cloud dashboard card, view mode",
    purpose:
      "Matches dashboard cards outside edit mode: full chart width, header status, footer/legend, no filters, and no toolbox.",
    payload: disproportionateSpikePayload,
    attributes: {
      expandable: false,
      hasToolbox: false,
      leftHeaderElements: [Status],
    },
    lineProps: {
      hasFilters: false,
    },
    height: "320px",
  },
  {
    id: "cloud-room-overview-time-magnitudes",
    title: "Cloud room overview, time magnitudes",
    purpose:
      "Production room overview surface using ns/µs/ms/s/m/h/d/w/mo/y magnitudes to inspect independent y-axis tick labels.",
    payload: secondsPayload,
    attributes: cloudRoomOverviewAttributes,
    rootAttributes: cloudRoomOverviewRootAttributes,
    height: "360px",
  },
  {
    id: "cloud-room-overview-fractional-y-axis-digits",
    title: "Cloud room overview, fractional y-axis digits",
    purpose:
      "Production room overview surface where millisecond y-axis labels need fractional digits to stay meaningful.",
    payload: fractionalYAxisPayload,
    attributes: cloudRoomOverviewAttributes,
    rootAttributes: cloudRoomOverviewRootAttributes,
    height: "360px",
  },
  ...fractionalPrecisionCases.map(({ digits, payload }) => ({
    id: `cloud-room-overview-fractional-precision-${digits}`,
    title: `Cloud room overview, ${digits} y-axis fractional digits`,
    purpose: `Stress case where the y-axis needs ${digits} fractional digits to avoid duplicate tick labels.`,
    payload,
    attributes: cloudRoomOverviewAttributes,
    rootAttributes: cloudRoomOverviewRootAttributes,
    height: "300px",
  })),
  {
    id: "cloud-room-overview-tiny-byte-detail",
    title: "Cloud room overview, selected tiny dimension",
    purpose:
      "Production room overview surface with only the tiny byte dimension visible from a multi-scale byte chart.",
    payload: tinyBytesPayload,
    selectedLegendDimensions: ["tiny"],
    attributes: cloudRoomOverviewAttributes,
    rootAttributes: cloudRoomOverviewRootAttributes,
    height: "360px",
  },
  {
    id: "cloud-room-overview-long-dimension-names",
    title: "Cloud room overview, long dimension names",
    purpose:
      "Production room overview surface with long metric labels to inspect legend and popover truncation.",
    payload: longDimensionNamesPayload,
    attributes: cloudRoomOverviewAttributes,
    rootAttributes: cloudRoomOverviewRootAttributes,
    height: "360px",
  },
  {
    id: "cloud-room-overview-very-big-values",
    title: "Cloud room overview, very big raw values",
    purpose:
      "Production room overview surface with non-scalable values large enough to require exponential notation.",
    payload: veryBigValuesPayload,
    attributes: cloudRoomOverviewAttributes,
    rootAttributes: cloudRoomOverviewRootAttributes,
    height: "360px",
  },
]

export const Overview = () => (
  <Page>
    {cloudCases.map(item => (
      <CloudChartCase key={item.id} {...item} />
    ))}
  </Page>
)

Overview.parameters = {
  netdataTheme: "dark",
}

export const FractionalDetailLoss = () => (
  <Page>
    <CloudChartCase
      id="units-fraction-loss-single"
      title="Cloud room overview, tiny byte detail"
      purpose="Production room overview surface for tiny byte values next to KiB and GiB dimensions."
      payload={tinyBytesPayload}
      attributes={cloudRoomOverviewAttributes}
      rootAttributes={cloudRoomOverviewRootAttributes}
    />
  </Page>
)

FractionalDetailLoss.parameters = {
  netdataTheme: "dark",
}

export const BorderlineThousands = () => (
  <Page>
    <CloudChartCase
      id="units-borderline-thousand-single"
      title="Cloud room overview, borderline 1000 threshold"
      purpose="Production room overview surface for rates where one value barely crosses 1000."
      payload={borderlinePayload}
      attributes={cloudRoomOverviewAttributes}
      rootAttributes={cloudRoomOverviewRootAttributes}
    />
  </Page>
)

BorderlineThousands.parameters = {
  netdataTheme: "dark",
}

export const FractionalYAxisDigits = () => (
  <Page>
    <CloudChartCase
      id="units-fractional-y-axis-digits-single"
      title="Cloud room overview, fractional y-axis digits"
      purpose="Production room overview surface where millisecond y-axis labels need fractional digits to stay meaningful."
      payload={fractionalYAxisPayload}
      attributes={cloudRoomOverviewAttributes}
      rootAttributes={cloudRoomOverviewRootAttributes}
    />
  </Page>
)

FractionalYAxisDigits.parameters = {
  netdataTheme: "dark",
}

export const FractionalPrecisionScale = () => (
  <Page>
    {fractionalPrecisionCases.map(({ digits, payload }) => (
      <CloudChartCase
        key={digits}
        id={`units-fractional-precision-${digits}-single`}
        title={`Cloud room overview, ${digits} y-axis fractional digits`}
        purpose={`Stress case where the y-axis needs ${digits} fractional digits to avoid duplicate tick labels.`}
        payload={payload}
        attributes={cloudRoomOverviewAttributes}
        rootAttributes={cloudRoomOverviewRootAttributes}
        height="300px"
      />
    ))}
  </Page>
)

FractionalPrecisionScale.parameters = {
  netdataTheme: "dark",
}

export const DisproportionateSpike = () => (
  <Page>
    <CloudChartCase
      id="units-disproportionate-spike-single"
      title="Cloud room overview, disproportionate one-second spike"
      purpose="Production room overview surface with one dimension near 2k and one near 100 with a single 10M spike."
      payload={disproportionateSpikePayload}
      attributes={cloudRoomOverviewAttributes}
      rootAttributes={cloudRoomOverviewRootAttributes}
    />
  </Page>
)

DisproportionateSpike.parameters = {
  netdataTheme: "dark",
}

export const TimeMagnitudes = () => (
  <Page>
    <CloudChartCase
      id="units-seconds-mixed-magnitude-single"
      title="Cloud room overview, time magnitudes"
      purpose="Production room overview surface for seconds data spanning ns/µs/ms/s/m/h/d/w/mo/y magnitudes."
      payload={secondsPayload}
      attributes={cloudRoomOverviewAttributes}
      rootAttributes={cloudRoomOverviewRootAttributes}
    />
  </Page>
)

TimeMagnitudes.parameters = {
  netdataTheme: "dark",
}

export const UnitDisplayMatrix = () => (
  <Page>
    {unitDisplayCases.map(item => (
      <CloudChartCase
        key={item.id}
        id={`units-display-${item.id}`}
        title={`Cloud room overview, ${item.title}`}
        purpose={item.purpose}
        payload={item.payload}
        attributes={cloudRoomOverviewAttributes}
        rootAttributes={cloudRoomOverviewRootAttributes}
        height="320px"
      />
    ))}
  </Page>
)

UnitDisplayMatrix.parameters = {
  netdataTheme: "dark",
}

export const LongDimensionNames = () => (
  <Page>
    <CloudChartCase
      id="units-long-dimension-names-single"
      title="Cloud room overview, long dimension names"
      purpose="Production room overview surface with long metric labels to inspect legend and popover truncation."
      payload={longDimensionNamesPayload}
      attributes={cloudRoomOverviewAttributes}
      rootAttributes={cloudRoomOverviewRootAttributes}
    />
  </Page>
)

LongDimensionNames.parameters = {
  netdataTheme: "dark",
}

export const VeryBigValues = () => (
  <Page>
    <CloudChartCase
      id="units-very-big-values-single"
      title="Cloud room overview, very big raw values"
      purpose="Production room overview surface with non-scalable values large enough to require exponential notation."
      payload={veryBigValuesPayload}
      attributes={cloudRoomOverviewAttributes}
      rootAttributes={cloudRoomOverviewRootAttributes}
    />
  </Page>
)

VeryBigValues.parameters = {
  netdataTheme: "dark",
}

export const DiagnosticsHarness = () => (
  <Page>
    {cases.map(item => (
      <ChartCase key={item.id} {...item} />
    ))}
  </Page>
)

DiagnosticsHarness.parameters = {
  netdataTheme: "light",
}

export default {
  title: "Charts/Units scaling",
}
