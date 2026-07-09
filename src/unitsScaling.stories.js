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
