import React, { useEffect, useMemo, useRef, useState } from "react"
import Line from "@/components/line"
import makeDefaultSDK from "./makeDefaultSDK"

const contextId = "storybook.high_cardinality"
const baseTimestamp = Date.UTC(2026, 0, 1)
const updateEvery = 5
const fixtureCache = new Map()
let chartSequence = 0

const sdk = makeDefaultSDK({
  attributes: {
    contextScope: [contextId],
    theme: "dark",
    designFlavour: "default",
    filterToolboxMode: "fixed",
    navigation: "pan",
    expandable: false,
  },
})

const getNow = () => globalThis.performance?.now?.() ?? Date.now()
const pad = (value, length) => String(value).padStart(length, "0")
const getValue = (dimensionIndex, pointIndex) =>
  ((dimensionIndex * 7919 + pointIndex * 104729) % 100000) / 100

const makeFixture = ({ dimensionCount, points, fullMetadata }) => {
  const startedAt = getNow()
  const idLength = String(dimensionCount).length
  const ids = new Array(dimensionCount)
  const priorities = new Array(dimensionCount)
  const aggregated = new Array(dimensionCount)
  const units = new Array(dimensionCount)
  const min = new Array(dimensionCount)
  const max = new Array(dimensionCount)
  const avg = new Array(dimensionCount)
  const arp = new Array(dimensionCount)
  const con = new Array(dimensionCount)
  const dimensions = new Array(dimensionCount)

  for (let index = 0; index < dimensionCount; index += 1) {
    const id = `metric_${pad(dimensionCount - index, idLength)}`
    const average = getValue(index, Math.floor(points / 2))

    ids[index] = id
    priorities[index] = index
    aggregated[index] = 1
    units[index] = "value"
    min[index] = 0
    max[index] = 1000
    avg[index] = average
    arp[index] = 0
    con[index] = (index % 100) + 1
    dimensions[index] = {
      id,
      pri: index,
      ds: { sl: 1, qr: 1 },
      sts: { min: 0, max: 1000, avg: average, arp: 0, con: con[index] },
    }
  }

  const rows = new Array(points)
  for (let pointIndex = 0; pointIndex < points; pointIndex += 1) {
    const row = new Array(dimensionCount + 1)
    row[0] = baseTimestamp + pointIndex * updateEvery * 1000

    for (let dimensionIndex = 0; dimensionIndex < dimensionCount; dimensionIndex += 1)
      row[dimensionIndex + 1] = getValue(dimensionIndex, pointIndex)

    rows[pointIndex] = row
  }

  const metadataCount = fullMetadata ? dimensionCount : 0
  const nodes = new Array(metadataCount)
  const instances = new Array(metadataCount)
  for (let index = 0; index < metadataCount; index += 1) {
    const suffix = pad(index, idLength)
    const stats = { min: 0, max: 1000, avg: getValue(index, points - 1), con: 1 }

    nodes[index] = {
      mg: `machine_${suffix}`,
      nd: `node_${suffix}`,
      nm: `node ${suffix}`,
      ni: index,
      is: { sl: 1, qr: 1 },
      ds: { sl: 1, qr: 1 },
      sts: stats,
    }
    instances[index] = {
      id: `instance_${suffix}`,
      ni: index,
      ds: { sl: 1, qr: 1 },
      sts: stats,
    }
  }

  const dimensionStats = { min, max, avg, arp, con }
  const firstTimestamp = rows[0][0]
  const lastTimestamp = rows[rows.length - 1][0]
  const payload = {
    api: 2,
    versions: {},
    summary: {
      nodes,
      contexts: [
        {
          id: contextId,
          ds: { sl: dimensionCount, qr: dimensionCount },
          sts: { min: 0, max: 1000, avg: 500, con: 100 },
        },
      ],
      instances,
      dimensions,
      labels: [],
      alerts: [],
    },
    totals: {
      contexts: { sl: 1 },
      nodes: { sl: metadataCount },
      instances: { sl: metadataCount },
      dimensions: { sl: dimensionCount },
      label_key_values: {},
    },
    functions: [],
    result: {
      labels: ["time", ...ids],
      point: { value: 0 },
      data: rows,
    },
    db: {
      tiers: 1,
      update_every: updateEvery,
      first_entry: Math.floor(firstTimestamp / 1000),
      last_entry: Math.floor(lastTimestamp / 1000),
      units: ["value"],
      dimensions: {
        ids,
        units,
        sts: dimensionStats,
      },
      per_tier: [],
    },
    view: {
      title: `${dimensionCount.toLocaleString()} deterministic dimensions`,
      update_every: updateEvery,
      after: Math.floor(firstTimestamp / 1000),
      before: Math.floor(lastTimestamp / 1000),
      units: ["value"],
      chart_type: "line",
      dimensions: {
        grouped_by: ["dimension"],
        ids,
        names: ids,
        units,
        priorities,
        aggregated,
        sts: dimensionStats,
      },
      min: 0,
      max: 1000,
    },
  }

  return {
    payload,
    generationMs: getNow() - startedAt,
  }
}

const getFixture = options => {
  const key = `${options.dimensionCount}:${options.points}:${options.fullMetadata}`
  if (!fixtureCache.has(key)) fixtureCache.set(key, makeFixture(options))
  return fixtureCache.get(key)
}

const makeChart = ({ payload, dimensionsSort, legend }) => {
  chartSequence += 1
  const chart = sdk.makeChart({
    getChart: async () => payload,
    attributes: {
      id: `high-cardinality-${chartSequence}`,
      contextScope: [contextId],
      after: payload.view.after,
      before: payload.view.before,
      points: payload.result.data.length,
      dimensionsSort,
      legend,
      expandable: false,
    },
  })

  sdk.appendChild(chart)
  return chart
}

const wait = duration => new Promise(resolve => setTimeout(resolve, duration))

const variants = {
  full: { fullMetadata: true, hasHeader: true, hasFooter: true, hasFilters: true, legend: true },
  withoutNidl: {
    fullMetadata: true,
    hasHeader: true,
    hasFooter: true,
    hasFilters: false,
    legend: true,
  },
  withoutLegend: {
    fullMetadata: true,
    hasHeader: true,
    hasFooter: true,
    hasFilters: true,
    legend: false,
  },
  graphOnlyFullMetadata: {
    fullMetadata: true,
    hasHeader: false,
    hasFooter: false,
    hasFilters: false,
    legend: false,
  },
  graphOnlyMinimalMetadata: {
    fullMetadata: false,
    hasHeader: false,
    hasFooter: false,
    hasFilters: false,
    legend: false,
  },
}

const HighCardinalityChart = ({ variant, dimensionCount, points, dimensionsSort }) => {
  const config = variants[variant]
  const fixture = useMemo(
    () => getFixture({ dimensionCount, points, fullMetadata: config.fullMetadata }),
    [dimensionCount, points, config.fullMetadata]
  )
  const chart = useMemo(
    () => makeChart({ payload: fixture.payload, dimensionsSort, legend: config.legend }),
    [fixture, dimensionsSort, config.legend]
  )
  const renderedCount = useRef(0)
  const runId = useRef(0)
  const [loaded, setLoaded] = useState(chart.getAttribute("loaded"))
  const [ready, setReady] = useState(false)
  const [renders, setRenders] = useState(0)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let active = true

    renderedCount.current = 0
    setLoaded(chart.getAttribute("loaded"))
    setReady(false)
    setRenders(0)
    setResult(null)

    const syncReady = () => {
      const nextLoaded = chart.getAttribute("loaded")

      setLoaded(nextLoaded)
      setReady(Boolean(nextLoaded && !chart.getUI().isRenderStale()))
    }
    const scheduleReady = () => queueMicrotask(() => active && syncReady())
    const offRendered = chart.getUI().on("rendered", () => {
      renderedCount.current += 1
      setRenders(renderedCount.current)
      syncReady()
    })
    const offLoaded = chart.onAttributeChange("loaded", scheduleReady)
    const offMounted = chart.on("mountChartUI", scheduleReady)

    scheduleReady()

    return () => {
      active = false
      runId.current += 1
      offRendered()
      offLoaded()
      offMounted()
      chart.destroy()
    }
  }, [chart])

  const testUnchangedRenders = async () => {
    const currentRun = runId.current + 1
    runId.current = currentRun
    const before = renderedCount.current

    setRunning(true)
    setResult(null)

    for (let index = 0; index < 20; index += 1) {
      chart.trigger("render")
      await wait(25)
      if (runId.current !== currentRun) return
    }

    await wait(25)
    if (runId.current !== currentRun) return

    setResult({ requested: 20, actual: renderedCount.current - before })
    setRunning(false)
  }

  return (
    <main>
      <header>
        <h1>High-cardinality chart anatomy</h1>
        <dl>
          <dt>Dimensions</dt>
          <dd>{dimensionCount.toLocaleString()}</dd>
          <dt>Points</dt>
          <dd>{points.toLocaleString()}</dd>
          <dt>Nodes and instances</dt>
          <dd>{config.fullMetadata ? dimensionCount.toLocaleString() : "not included"}</dd>
          <dt>Fixture generation</dt>
          <dd>{fixture.generationMs.toFixed(1)} ms</dd>
          <dt>Actual SDK redraws observed</dt>
          <dd>{renders.toLocaleString()}</dd>
        </dl>
        <button
          type="button"
          disabled={!loaded || !ready || running}
          onClick={testUnchangedRenders}
        >
          {running ? "Testing unchanged render requests…" : "Request 20 unchanged renders"}
        </button>
        {result && (
          <p>
            Requested {result.requested}; actual redraws {result.actual}.
          </p>
        )}
      </header>
      <Line
        chart={chart}
        hasHeader={config.hasHeader}
        hasFooter={config.hasFooter}
        hasFilters={config.hasFilters}
        height="720px"
        width="100%"
      />
    </main>
  )
}

const Story = variant => args => <HighCardinalityChart {...args} variant={variant} />

export const Full = Story("full")
export const WithoutNidl = Story("withoutNidl")
export const WithoutLegend = Story("withoutLegend")
export const GraphOnlyFullMetadata = Story("graphOnlyFullMetadata")
export const GraphOnlyMinimalMetadata = Story("graphOnlyMinimalMetadata")

export default {
  title: "Performance/High-cardinality chart anatomy",
  component: HighCardinalityChart,
  parameters: {
    netdataTheme: "dark",
  },
  args: {
    dimensionCount: 10000,
    points: 60,
    dimensionsSort: "valueDesc",
  },
  argTypes: {
    dimensionCount: {
      control: { type: "select" },
      options: [100, 1000, 5000, 10000],
    },
    points: {
      control: { type: "select" },
      options: [2, 60, 297],
    },
    dimensionsSort: {
      control: { type: "select" },
      options: ["default", "nameAsc", "valueDesc"],
    },
    variant: {
      table: { disable: true },
    },
  },
}
