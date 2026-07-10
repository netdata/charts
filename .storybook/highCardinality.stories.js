import React, { useLayoutEffect, useMemo } from "react"
import { Flex } from "@netdata/netdata-ui"
import Line from "../src/components/line"
import makeDefaultSDK from "../src/makeDefaultSDK"

const fixtureBaseUrl = "/high-cardinality-fixtures"
const fixtureWindow = {
  after: 1783630694,
  before: 1783631594,
  selectedAfter: 1783630994,
  selectedBefore: 1783631294,
}

const fixtureCache = new Map()

const loadFixture = (name, originalFetch) => {
  if (!fixtureCache.has(name)) {
    fixtureCache.set(
      name,
      originalFetch(`${fixtureBaseUrl}/${name}.json`)
        .then(response => {
          if (!response.ok) throw new Error(`Unable to load local fixture: ${name}`)
          return response.json()
        })
    )
  }
  return fixtureCache.get(name)
}

const adaptSparklineFixture = (payload, requestedDimensions) => {
  const sourceDimensions = payload.result.labels.length - 1
  if (!sourceDimensions || !requestedDimensions.length) return payload

  const selectSource = (values, index) => values?.[index % sourceDimensions]
  const dimensions = payload.view.dimensions

  return {
    ...payload,
    result: {
      ...payload.result,
      labels: ["time", ...requestedDimensions],
      data: payload.result.data.map(row => [
        row[0],
        ...requestedDimensions.map((_, index) => row[(index % sourceDimensions) + 1]),
      ]),
    },
    view: {
      ...payload.view,
      dimensions: {
        ...dimensions,
        aggregated: requestedDimensions.map((_, index) =>
          selectSource(dimensions.aggregated, index)
        ),
        ids: requestedDimensions,
        names: requestedDimensions,
        priorities: requestedDimensions.map((_, index) =>
          selectSource(dimensions.priorities, index)
        ),
        sts: requestedDimensions.map((_, index) => selectSource(dimensions.sts, index)),
        units: requestedDimensions.map((_, index) => selectSource(dimensions.units, index)),
      },
    },
  }
}

const isSelectedArea = body =>
  body?.window?.after === fixtureWindow.selectedAfter ||
  body?.window?.before === fixtureWindow.selectedBefore

const selectDataFixture = body => {
  const selectedDimensions = body?.selectors?.dimensions || []
  const scopedContexts = body?.scope?.contexts || []
  if (
    selectedDimensions.length &&
    selectedDimensions[0] !== "*" &&
    !scopedContexts.includes("netdata.streaming.in.state")
  )
    return "streaming-correlate-context-sparklines"

  const after = body?.window?.after
  if (after < fixtureWindow.after - 300000) return "streaming-compare-7d"
  if (after < fixtureWindow.after - 40000) return "streaming-compare-24h"
  return "streaming-by-instance-percentage"
}

const selectWeightsFixture = body => {
  if (body?.method === "value") {
    return isSelectedArea(body) ? "streaming-drilldown-selected-area" : "streaming-drilldown-window"
  }

  return isSelectedArea(body)
    ? "streaming-correlate-selected-area-corrected"
    : "streaming-correlate-window-corrected"
}

const splitQueryList = value => (value ? value.split("|").filter(Boolean) : [])

const parseQueryNumber = value => {
  if (value === null) return undefined
  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

const getFixtureRequest = (url, options) => {
  if (options.body) return JSON.parse(options.body)

  return {
    method: url.searchParams.get("method") || undefined,
    window: {
      after: parseQueryNumber(url.searchParams.get("after")),
      before: parseQueryNumber(url.searchParams.get("before")),
    },
    selectors: {
      dimensions: splitQueryList(url.searchParams.get("dimensions")),
    },
    scope: {
      contexts: splitQueryList(url.searchParams.get("scope_contexts")),
    },
  }
}

const installFixtureTransport = () => {
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, window.location.origin)
    if (!url.pathname.startsWith("/local-high-cardinality-api/"))
      return originalFetch(input, options)

    const body = getFixtureRequest(url, options)
    const fixtureName = url.pathname.endsWith("/weights")
      ? selectWeightsFixture(body)
      : selectDataFixture(body)
    const fixture = await loadFixture(fixtureName, originalFetch)
    const payload =
      fixtureName === "streaming-correlate-context-sparklines"
        ? adaptSparklineFixture(fixture, body?.selectors?.dimensions || [])
        : fixture

    return {
      ok: true,
      json: async () => payload,
    }
  }

  return () => {
    window.fetch = originalFetch
  }
}

const createChart = action => {
  const sdk = makeDefaultSDK({
    attributes: {
      after: fixtureWindow.after,
      before: fixtureWindow.before,
      contextScope: ["netdata.streaming.in.state"],
      containerWidth: 1600,
      host: "/local-high-cardinality-api",
      groupBy: ["instance"],
      aggregationMethod: "percentage",
      selectedDimensions: ["running", "waiting replication", "replicating", "waiting"],
      points: 300,
      theme: "dark",
      expanded: true,
      expandedHeight: 520,
      drawer: {
        action,
        tab: "window",
        showAdvancedStats: false,
      },
      overlays: {
        highlight: {
          type: "highlight",
          range: [fixtureWindow.selectedAfter, fixtureWindow.selectedBefore],
        },
        proceeded: { type: "proceeded" },
      },
    },
  })
  const chart = sdk.makeChart()
  sdk.appendChild(chart)
  return chart
}

const HighCardinalityChart = ({ action }) => {
  useLayoutEffect(installFixtureTransport, [])
  const chart = useMemo(() => createChart(action), [action])

  useLayoutEffect(() => () => chart.destroy(), [chart])

  return (
    <Flex width="100%" padding={[2]} background="mainBackground">
      <Line chart={chart} height="1100px" />
    </Flex>
  )
}

export const Values = () => <HighCardinalityChart action="values" />
export const DrillDown = () => <HighCardinalityChart action="drillDown" />
export const Compare = () => <HighCardinalityChart action="compare" />
export const Correlate = () => <HighCardinalityChart action="correlate" />

const meta = {
  title: "Performance/Local high-cardinality expanded chart",
  parameters: {
    netdataTheme: "dark",
  },
}

export default meta
