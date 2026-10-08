import React, { useEffect, useMemo, useState } from "react"
import { DarkTheme, Flex, Text } from "@netdata/netdata-ui"
import { ThemeProvider } from "styled-components"
import D3Pie from "@/components/d3pie"
import EasyPie from "@/components/easyPie"
import Gauge from "@/components/gauge"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import systemLoadLine from "../fixtures/systemLoadLine"

const makeHeatmapPayload = () => {
  const ids = ["0.1", "1", "10"]
  const values = [
    [1, 2, 3],
    [3, 0, 2],
    [2, 4, 1],
  ]
  const stats = ids.map(() => 0)

  return {
    api: 2,
    summary: {
      nodes: [{ mg: "node-1", nd: "node-1", nm: "node-1", ni: 0 }],
      contexts: [
        {
          id: "benchmark.heatmap",
          sts: { min: 0, max: 4, avg: 0, con: 0 },
        },
      ],
      instances: [],
      dimensions: ids.map((id, index) => ({
        id,
        pri: index,
        sts: { min: 0, max: 4, avg: 0, con: 0 },
      })),
      labels: [],
      alerts: [],
    },
    db: { update_every: 1, first_entry: 1, last_entry: 3 },
    view: {
      title: "Heatmap",
      update_every: 1,
      units: "requests/s",
      chart_type: "heatmap",
      dimensions: {
        grouped_by: ["dimension"],
        ids,
        names: ids,
        units: ids.map(() => "requests/s"),
        priorities: ids.map((_, index) => index),
        aggregated: ids.map(() => 1),
        sts: { min: stats, max: stats, avg: stats, arp: stats, con: stats },
      },
      min: 0,
      max: 4,
    },
    result: {
      labels: ["time", ...ids],
      point: { value: 0, arp: 1, pa: 2 },
      data: values.map((row, index) => [
        1000 + index * 1000,
        ...row.map(value => [value, 0, 0]),
      ]),
    },
  }
}

const definitions = [
  { id: "line", component: Line },
  { id: "area", component: Line },
  { id: "stacked", component: Line },
  { id: "stackedBar", component: Line },
  { id: "multiBar", component: Line },
  { id: "heatmap", component: Line, payload: makeHeatmapPayload() },
  { id: "easypiechart", component: EasyPie },
  { id: "gauge", component: Gauge },
  { id: "d3pie", component: D3Pie },
]

const ChartCard = ({ backend, definition }) => {
  const [, setRevision] = useState(0)
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({ rendererPolicy: () => backend })
    const timeSeries = definition.component === Line
    const chart = sdk.makeChart({
      getChart: makeMockPayload(definition.payload || systemLoadLine[0], {
        delay: 0,
      }),
      attributes: {
        contextScope: ["system.load"],
        ...(timeSeries
          ? { chartType: definition.id }
          : { chartLibrary: definition.id }),
      },
    })
    sdk.appendChild(chart)
    return chart
  }, [backend, definition])

  useEffect(() => {
    const off = chart.on("rendererFallback", () => setRevision(value => value + 1))
    return () => {
      off()
      chart.destroy()
    }
  }, [chart])

  const Component = definition.component
  const state = chart.getRendererState()

  return (
    <Flex column gap={1} padding={[2]} border="mainChartBorder" height="260px">
      <Text>
        {definition.id}: {state.active}
      </Text>
      <Flex flex minHeight="0">
        <Component chart={chart} height="220px" width="100%" />
      </Flex>
    </Flex>
  )
}

const RendererGallery = ({ backend }) => (
  <ThemeProvider theme={DarkTheme}>
    <Flex background="mainBackground" padding={[2]} gap={2} wrap>
      {definitions.map(definition => (
        <Flex key={definition.id} width="380px">
          <ChartCard backend={backend} definition={definition} />
        </Flex>
      ))}
    </Flex>
  </ThemeProvider>
)

export const WebGPU = () => <RendererGallery backend="webgpu" />
export const WebGL2 = () => <RendererGallery backend="webgl2" />
export const ForcedLegacyFallback = () => (
  <RendererGallery backend="unregistered-renderer" />
)

WebGPU.parameters = { netdataTheme: "dark" }
WebGL2.parameters = { netdataTheme: "dark" }
ForcedLegacyFallback.parameters = { netdataTheme: "dark" }

export default {
  title: "Performance/GPU renderer gallery",
  component: RendererGallery,
}
