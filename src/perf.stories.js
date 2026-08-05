import React, { useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"
import systemLoadLine from "../fixtures/systemLoadLine"

const [basePayload] = systemLoadLine

// deterministic, so repeated benchmark runs compare like for like
const pseudoRandom = seed => {
  const value = Math.sin(seed) * 10000
  return value - Math.floor(value)
}

const makeSeries = (rows, dims) => {
  const data = new Array(rows)
  const startMs = basePayload.result.data[0][0]

  for (let row = 0; row < rows; row++) {
    const point = new Array(dims + 1)
    point[0] = startMs + row * 1000

    for (let dim = 0; dim < dims; dim++) {
      const wave = Math.sin((row / 30) * (1 + dim * 0.1)) * (10 + dim)
      point[dim + 1] = 20 + dim * 2 + wave + pseudoRandom(row * (dim + 1)) * 4
    }

    data[row] = point
  }

  return data
}

const makeSyntheticPayload = (rows, dims, chartType) => {
  const ids = Array.from({ length: dims }, (v, index) => `dim${index}`)
  const fill = value => ids.map(() => value)

  return {
    ...basePayload,
    view: {
      ...basePayload.view,
      update_every: 1,
      chart_type: chartType === "heatmap" ? "line" : chartType,
      dimensions: {
        grouped_by: ["dimension"],
        ids,
        names: ids,
        units: fill("load"),
        priorities: ids.map((id, index) => index),
        aggregated: fill(1),
        sts: {
          min: fill(0),
          max: fill(60),
          avg: fill(25),
          arp: fill(0),
          con: fill(100 / dims),
        },
      },
    },
    summary: {
      ...basePayload.summary,
      dimensions: ids.map((id, index) => ({
        id,
        ds: { sl: 1, qr: 1 },
        sts: { min: 0, max: 60, avg: 25, con: 100 / dims },
        pri: index,
      })),
    },
    result: {
      ...basePayload.result,
      labels: ["time", ...ids],
      data: makeSeries(rows, dims),
    },
  }
}

export const Benchmark = ({
  chartLibrary,
  count,
  rows,
  dims,
  chartType,
  height,
  streaming,
  autofetchOnHovering,
}) => {
  const isStreaming = streaming !== false && streaming !== "false"
  const hoverKeepsFetching = autofetchOnHovering === true || autofetchOnHovering === "true"

  const charts = useMemo(() => {
    const numericCount = Number(count)

    const getChart = makeMockPayload(
      makeSyntheticPayload(Number(rows), Number(dims), chartType),
      { delay: 300 }
    )

    const sdk = makeDefaultSDK({
      attributes: {
        chartLibrary,
        perfMonitor: true,
        syncHover: true,
        autofetchOnHovering: hoverKeepsFetching,
      },
    })

    return Array.from({ length: numericCount }, () => {
      const chart = sdk.makeChart({
        getChart,
        attributes: {
          contextScope: ["system.load"],
          chartType,
          syncHover: true,
          autofetch: isStreaming,
          after: -600,
        },
      })
      sdk.appendChild(chart)
      return chart
    })
  }, [chartLibrary, count, rows, dims, chartType, isStreaming, hoverKeepsFetching])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex flexWrap gap={2} data-testid="perfBenchmark">
        {charts.map(chart => (
          <Line key={chart.getId()} chart={chart} height={height} width="320px" />
        ))}
      </Flex>
    </ThemeProvider>
  )
}

Benchmark.args = {
  chartLibrary: "dygraph",
  count: 25,
  rows: 300,
  dims: 3,
  chartType: "line",
  height: "300px",
  streaming: true,
  autofetchOnHovering: false,
}
Benchmark.argTypes = {
  chartLibrary: { name: "Chart library", control: "select", options: ["dygraph", "uplot"] },
  count: { name: "Chart count", control: "number" },
  rows: { name: "Rows per chart", control: "number" },
  dims: { name: "Dimensions per chart", control: "number" },
  chartType: {
    name: "Chart type",
    control: "select",
    options: ["line", "stacked", "heatmap", "stackedBar", "multiBar", "area"],
  },
  height: { name: "Chart height", control: "text" },
  streaming: { name: "Autofetch (streaming)", control: "boolean" },
  autofetchOnHovering: { name: "Keep fetching while hovered", control: "boolean" },
}

export default {
  title: "Perf/Benchmark",
  component: Benchmark,
  parameters: {
    docs: {
      description: {
        component:
          "Streaming dygraph-vs-uPlot A/B on synthetic data. rows/dims size the payload, so absolute numbers are meaningful at a chosen scale; compare the dygraph/uPlot ratio under identical settings. Driven headlessly by `yarn perf:bench`.",
      },
    },
  },
}
