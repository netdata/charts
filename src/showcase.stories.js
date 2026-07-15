import React, { useEffect, useMemo } from "react"
import styled, { ThemeProvider } from "styled-components"
import {
  Flex,
  TextHuge,
  TextMicro,
  TextSmall,
  getSizeBy,
  DefaultTheme,
  DarkTheme,
} from "@netdata/netdata-ui"
import Line from "@/components/line"
import {
  useChart,
  useVisibleDimensionIds,
  useLatestDisplayValueWithUnit,
  withChartProvider,
} from "@/components/provider"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

const now = 1729763970000
const points = 97
const updateEvery = 5

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

const makePayload = ({ context, title, unit, dimensions, chartType = "line" }) => {
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
    ...normalizedDimensions.map(dimension => [dimension.values[index], dimension.anomalyRates[index], 0]),
  ])

  return {
    api: 2,
    versions: {},
    summary: {
      nodes: [],
      contexts: [{ id: context, sts: { ...values, con: 100 } }],
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
      labels: ["time", ...names],
      point: { value: 0, arp: 1, pa: 2 },
      data: rows,
    },
    db: {
      tiers: 1,
      update_every: updateEvery,
      first_entry: Math.floor(rows[0][0] / 1000),
      last_entry: Math.floor(rows[rows.length - 1][0] / 1000),
      units,
      dimensions: { ids, units: dimensionUnits, sts: dimensionStats },
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

const cpuContext = "showcase.system.cpu"
const loadContext = "showcase.system.load"
const netContext = "showcase.net.traffic"
const diskContext = "showcase.disk.ops"
const memoryContext = "showcase.system.ram"
const requestsContext = "showcase.web.requests"

const cpuPayload = chartType =>
  makePayload({
    context: cpuContext,
    title: "CPU utilization",
    unit: "%",
    chartType,
    dimensions: [
      { id: "user", name: "user", values: makeWave({ center: 26, amplitude: 9, cycles: 2.2, phase: 0.3 }) },
      { id: "system", name: "system", values: makeWave({ center: 13, amplitude: 5, cycles: 2.6, phase: 1.1 }) },
      { id: "iowait", name: "iowait", values: makeWave({ center: 6, amplitude: 3.4, cycles: 3.1, phase: 0.6 }) },
      { id: "softirq", name: "softirq", values: makeWave({ center: 3.2, amplitude: 1.8, cycles: 3.4, phase: 2 }) },
    ],
  })

const loadPayload = chartType =>
  makePayload({
    context: loadContext,
    title: "System load average",
    unit: "load",
    chartType,
    dimensions: [
      { id: "load1", name: "load1", values: makeWave({ center: 2.4, amplitude: 0.7, cycles: 2.1, phase: 0.4 }) },
      { id: "load5", name: "load5", values: makeWave({ center: 2, amplitude: 0.42, cycles: 1.8, phase: 1 }) },
      { id: "load15", name: "load15", values: makeWave({ center: 1.7, amplitude: 0.24, cycles: 1.5, phase: 1.7 }) },
    ],
  })

const netPayload = chartType =>
  makePayload({
    context: netContext,
    title: "Network traffic",
    unit: "kilobits/s",
    chartType,
    dimensions: [
      { id: "received", name: "received", values: makeWave({ center: 9000, amplitude: 3500, cycles: 2.3, phase: 0.2 }) },
      { id: "sent", name: "sent", values: makeWave({ center: -6500, amplitude: 2800, cycles: 2.7, phase: 1.3 }) },
    ],
  })

const diskPayload = chartType =>
  makePayload({
    context: diskContext,
    title: "Disk operations",
    unit: "operations/s",
    chartType,
    dimensions: [
      { id: "reads", name: "reads", values: makeWave({ center: 320, amplitude: 120, cycles: 2.5, phase: 0.5 }) },
      { id: "writes", name: "writes", values: makeWave({ center: 210, amplitude: 90, cycles: 2.9, phase: 1.6 }) },
    ],
  })

const memoryPayload = chartType =>
  makePayload({
    context: memoryContext,
    title: "Memory allocation",
    unit: "MiB",
    chartType,
    dimensions: [
      { id: "used", name: "used", values: makeWave({ center: 5200, amplitude: 780, cycles: 2, phase: 0.2 }) },
      { id: "cached", name: "cached", values: makeWave({ center: 2600, amplitude: 460, cycles: 2.4, phase: 1 }) },
      { id: "buffers", name: "buffers", values: makeWave({ center: 640, amplitude: 150, cycles: 3, phase: 1.8 }) },
      { id: "free", name: "free", values: makeWave({ center: 1400, amplitude: 380, cycles: 2.2, phase: 2.4 }) },
    ],
  })

const requestsPayload = chartType =>
  makePayload({
    context: requestsContext,
    title: "Web requests",
    unit: "requests/s",
    chartType,
    dimensions: [
      { id: "success", name: "success", values: makeWave({ center: 1250, amplitude: 420, cycles: 2.4, phase: 0.8 }) },
    ],
  })

const singleMetric = ({ context, id, unit, center, amplitude, cycles = 2.4, phase = 0.3, chartType }) =>
  makePayload({
    context,
    title: id,
    unit,
    chartType,
    dimensions: [{ id, name: id, values: makeWave({ center, amplitude, cycles, phase }) }],
  })

const createChart = ({ context, payload, chartType, theme, sparkline, colors, attributes = {} }) => {
  const sdk = makeDefaultSDK({
    attributes: {
      theme,
      containerWidth: 1200,
      navigation: "pan",
      expandable: false,
    },
  })

  const chart = sdk.makeChart({
    getChart: makeMockPayload(payload),
    attributes: {
      chartLibrary: "uplot",
      chartType,
      contextScope: [context],
      ...(sparkline && { sparkline: true }),
      ...(colors && { colors }),
      ...attributes,
    },
  })

  sdk.appendChild(chart)
  return chart
}

const useChartInstance = config => {
  const chart = useMemo(() => createChart(config), [])
  useEffect(() => () => chart.destroy(), [chart])
  return chart
}

const Page = styled(Flex).attrs({
  column: true,
  gap: 8,
  padding: [8, 6, 12],
  width: { min: "0px", max: getSizeBy(150), base: "100%" },
})`
  box-sizing: border-box;
`

const Eyebrow = styled(TextMicro).attrs({ color: "primary" })`
  text-transform: uppercase;
  letter-spacing: 0.22em;
  font-weight: 700;
`

const Display = styled(TextHuge).attrs({ color: "text" })`
  font-size: 34px;
  line-height: 1.08;
  letter-spacing: -0.02em;
  font-weight: 700;
`

const Stat = styled(TextHuge).attrs({ color: "text" })`
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
  line-height: 1;
  font-weight: 700;
`

const Dot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 3px;
  flex-shrink: 0;
  background: ${props => props.color};
`

const Card = styled(Flex).attrs(props => ({
  column: true,
  gap: 3,
  padding: [4],
  round: 2,
  border: { side: "all", color: "borderSecondary" },
  background: "mainChartBg",
  ...props,
}))`
  box-sizing: border-box;
`

const Grid = styled(Flex).attrs({ gap: 4, width: "100%" })`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${getSizeBy(70)}, 1fr));
`

const StatStrip = styled(Flex).attrs({ gap: 4, width: "100%" })`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${getSizeBy(42)}, 1fr));
`

const Legend = withChartProvider(() => {
  const chart = useChart()
  const ids = useVisibleDimensionIds()

  if (!ids.length) return null

  return (
    <Flex gap={4} alignItems="center" as="ul" margin={[0]} padding={[0]}>
      {ids.map(id => (
        <Flex as="li" key={id} gap={1.5} alignItems="center">
          <Dot color={chart.selectDimensionColor(id)} />
          <TextMicro color="textLite">{chart.getDimensionName(id) || id}</TextMicro>
        </Flex>
      ))}
    </Flex>
  )
})

const Caption = ({ title, subtitle, unit }) => (
  <Flex justifyContent="between" alignItems="start" gap={2}>
    <Flex column gap={0.5}>
      <TextSmall color="text" strong>
        {title}
      </TextSmall>
      {subtitle && <TextMicro color="textDescription">{subtitle}</TextMicro>}
    </Flex>
    {unit && (
      <TextMicro color="textNoFocus" style={{ whiteSpace: "nowrap" }}>
        {unit}
      </TextMicro>
    )}
  </Flex>
)

const ChartCard = ({ config, title, subtitle, unit, height = "220px", legend = true }) => {
  const chart = useChartInstance(config)

  return (
    <Card>
      <Caption title={title} subtitle={subtitle} unit={unit} />
      <Flex height={height} width="100%">
        <Line chart={chart} hasHeader={false} hasFooter={false} hasFilters={false} height="100%" width="100%" />
      </Flex>
      {legend && <Legend chart={chart} />}
    </Card>
  )
}

const StatTile = withChartProvider(({ label, dimensionId }) => {
  const chart = useChart()
  const { convertedValue, convertedUnit } = useLatestDisplayValueWithUnit(dimensionId)

  return (
    <Card gap={2} padding={[3, 4]}>
      <Eyebrow>{label}</Eyebrow>
      <Flex gap={1} alignItems="baseline">
        <Stat>{convertedValue}</Stat>
        <TextMicro color="textDescription">{convertedUnit}</TextMicro>
      </Flex>
      <Flex height="40px" width="100%">
        <Line chart={chart} hasHeader={false} hasFooter={false} hasFilters={false} height="100%" width="100%" />
      </Flex>
    </Card>
  )
})

const StatTileCard = ({ config, label, dimensionId }) => {
  const chart = useChartInstance(config)
  return <StatTile chart={chart} label={label} dimensionId={dimensionId} />
}

const Masthead = ({ theme }) => (
  <Flex column gap={3}>
    <Eyebrow>Netdata charts · uPlot renderer</Eyebrow>
    <Display>Time-series, rendered with intent.</Display>
    <TextSmall color="textDescription" style={{ maxWidth: getSizeBy(90) }}>
      One theme-driven canvas across every mode — lines, gradient areas, diverging stacks and bars.
      Hairline grids, tabular axes and a calm crosshair, tuned for the {theme} theme.
    </TextSmall>
    <Flex height="2px" width={getSizeBy(10)} background="primary" round={1} margin={[2, 0, 0]} />
  </Flex>
)

const SectionHeader = ({ title, description }) => (
  <Flex column gap={1}>
    <Flex gap={2} alignItems="center">
      <Flex width="6px" height="16px" background="primary" round={0.5} />
      <TextSmall color="text" strong>
        {title}
      </TextSmall>
    </Flex>
    <TextMicro color="textDescription" style={{ marginLeft: getSizeBy(2) }}>
      {description}
    </TextMicro>
  </Flex>
)

const statTiles = theme => [
  {
    label: "Requests",
    dimensionId: "req",
    config: {
      context: "showcase.kpi.req",
      chartType: "area",
      theme,
      sparkline: true,
      colors: ["#00AB44"],
      payload: singleMetric({
        context: "showcase.kpi.req",
        id: "req",
        unit: "requests/s",
        center: 1250,
        amplitude: 420,
        chartType: "area",
      }),
    },
  },
  {
    label: "CPU",
    dimensionId: "cpu",
    config: {
      context: "showcase.kpi.cpu",
      chartType: "line",
      theme,
      sparkline: true,
      colors: ["#3366CC"],
      payload: singleMetric({
        context: "showcase.kpi.cpu",
        id: "cpu",
        unit: "%",
        center: 34,
        amplitude: 12,
        cycles: 3,
        chartType: "line",
      }),
    },
  },
  {
    label: "Egress",
    dimensionId: "egress",
    config: {
      context: "showcase.kpi.egress",
      chartType: "area",
      theme,
      sparkline: true,
      colors: ["#FF9900"],
      payload: singleMetric({
        context: "showcase.kpi.egress",
        id: "egress",
        unit: "megabits/s",
        center: 640,
        amplitude: 220,
        phase: 1.2,
        chartType: "area",
      }),
    },
  },
  {
    label: "P95 latency",
    dimensionId: "latency",
    config: {
      context: "showcase.kpi.latency",
      chartType: "line",
      theme,
      sparkline: true,
      colors: ["#994499"],
      payload: singleMetric({
        context: "showcase.kpi.latency",
        id: "latency",
        unit: "milliseconds",
        center: 82,
        amplitude: 26,
        cycles: 3.6,
        phase: 2,
        chartType: "line",
      }),
    },
  },
]

const dashboardCards = theme => [
  {
    title: "System load average",
    subtitle: "load1 · load5 · load15",
    unit: "load",
    config: { context: loadContext, chartType: "line", theme, payload: loadPayload("line") },
  },
  {
    title: "Web requests",
    subtitle: "successful responses",
    unit: "requests/s",
    config: { context: requestsContext, chartType: "area", theme, payload: requestsPayload("area") },
    legend: false,
  },
  {
    title: "Network traffic",
    subtitle: "received vs. sent, diverging stack",
    unit: "kilobits/s",
    config: { context: netContext, chartType: "stacked", theme, payload: netPayload("stacked") },
  },
  {
    title: "Disk operations",
    subtitle: "reads vs. writes",
    unit: "operations/s",
    config: { context: diskContext, chartType: "multiBar", theme, payload: diskPayload("multiBar") },
  },
  {
    title: "Memory allocation",
    subtitle: "used · cached · buffers · free",
    unit: "MiB",
    config: { context: memoryContext, chartType: "stackedBar", theme, payload: memoryPayload("stackedBar") },
  },
]

const renderModes = theme => [
  { title: "Line", subtitle: "system.load", config: { context: loadContext, chartType: "line", theme, payload: loadPayload("line") } },
  { title: "Area", subtitle: "gradient fill", config: { context: requestsContext, chartType: "area", theme, payload: requestsPayload("area") }, legend: false },
  { title: "Stacked area", subtitle: "cpu utilization", config: { context: cpuContext, chartType: "stacked", theme, payload: cpuPayload("stacked") } },
  { title: "Diverging stack", subtitle: "net in / out", config: { context: netContext, chartType: "stacked", theme, payload: netPayload("stacked") } },
  { title: "Multi bar", subtitle: "disk ops", config: { context: diskContext, chartType: "multiBar", theme, payload: diskPayload("multiBar") } },
  { title: "Stacked bar", subtitle: "memory", config: { context: memoryContext, chartType: "stackedBar", theme, payload: memoryPayload("stackedBar") } },
]

const Showcase = ({ theme }) => {
  const heroChart = useChartInstance({
    context: cpuContext,
    chartType: "stacked",
    theme,
    payload: cpuPayload("stacked"),
  })

  return (
    <Page>
      <Masthead theme={theme} />

      <Flex column gap={4}>
        <SectionHeader
          title="Live signals"
          description="Sparklines and headline values share the renderer's typography and color."
        />
        <StatStrip>
          {statTiles(theme).map(tile => (
            <StatTileCard key={tile.label} {...tile} />
          ))}
        </StatStrip>
      </Flex>

      <Flex column gap={4}>
        <SectionHeader
          title="Hero — CPU utilization"
          description="A stacked area with per-band gradient fills and crisp separating edges."
        />
        <Card padding={[5]} gap={4} border={{ side: "top", color: "primary" }}>
          <Caption title="CPU utilization" subtitle="user · system · iowait · softirq" unit="%" />
          <Flex height="320px" width="100%">
            <Line
              chart={heroChart}
              hasHeader={false}
              hasFooter={false}
              hasFilters={false}
              height="100%"
              width="100%"
            />
          </Flex>
          <Legend chart={heroChart} />
        </Card>
      </Flex>

      <Flex column gap={4}>
        <SectionHeader
          title="Dashboard grid"
          description="A responsive grid mixing every render mode on one calm surface system."
        />
        <Grid>
          {dashboardCards(theme).map(card => (
            <ChartCard key={card.title} {...card} />
          ))}
        </Grid>
      </Flex>
    </Page>
  )
}

const ThemedShowcase = ({ theme }) => {
  const uiTheme = theme === "dark" ? DarkTheme : DefaultTheme

  return (
    <ThemeProvider theme={uiTheme}>
      <Flex background="mainBackground" width="100%" justifyContent="center">
        <Showcase theme={theme} />
      </Flex>
    </ThemeProvider>
  )
}

export const Overview = () => <ThemedShowcase theme="dark" />

Overview.parameters = { netdataTheme: "dark" }

export const LightTheme = () => <ThemedShowcase theme="default" />

export const RenderModes = ({ theme = "dark" }) => {
  const uiTheme = theme === "dark" ? DarkTheme : DefaultTheme

  return (
    <ThemeProvider theme={uiTheme}>
      <Flex background="mainBackground" width="100%" justifyContent="center">
        <Page>
          <Masthead theme={theme} />
          <Flex column gap={4}>
            <SectionHeader
              title="Every render mode"
              description="The same payload family across each uPlot path, side by side for inspection."
            />
            <Grid>
              {renderModes(theme).map(card => (
                <ChartCard key={card.title} {...card} height="200px" />
              ))}
            </Grid>
          </Flex>
        </Page>
      </Flex>
    </ThemeProvider>
  )
}

RenderModes.parameters = { netdataTheme: "dark" }

export default {
  title: "Charts/uPlot/Showcase",
  parameters: {
    layout: "fullscreen",
  },
}
