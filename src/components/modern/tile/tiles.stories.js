import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import dashboardIcon from "@netdata/netdata-ui/dist/components/icon/assets/dashboard_add.svg"
import Gauge from "@/components/gauge"
import EasyPie from "@/components/easyPie"
import NumberChart from "@/components/number"
import Bars from "@/components/bars"
import D3pie from "@/components/d3pie"
import { Line } from "@/components/line"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import Icon, { Button } from "@/components/icon"
import Settings from "@/components/toolbox/settings"
import Fullscreen from "@/components/toolbox/fullscreen"
import makeMockPayload from "@/helpers/makeMockPayload"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import systemLoadLine from "../../../../fixtures/systemLoadLine"

const [loadPayload] = systemLoadLine

const LineTile = props => (
  <ChartWrapper>
    <Line hasHeader={false} hasFilters={false} hasFooter={false} {...props} />
  </ChartWrapper>
)
const Sparkline = withChart(LineTile, { tile: true })

const AddToDashboard = ({ disabled }) => (
  <Button
    icon={<Icon svg={dashboardIcon} size="16px" />}
    title="Add to dashboard"
    disabled={disabled}
  />
)

const single = ({ context, title, unit, id, values }) =>
  makePayload({ context, title, unit, dimensions: [{ id, values }] })

const withAlerts = (payload, alerts) => ({ ...payload, summary: { ...payload.summary, alerts } })

const pressure = single({
  context: "modern.cpu.pressure",
  title: "Avg CPU pressure",
  unit: "percentage",
  id: "some 10",
  values: makeWave({ center: 2.9, amplitude: 1.6, cycles: 2 }),
})

const latestValue = { overlays: { latestValue: { type: "latestValue" } } }

const tiles = [
  {
    label: "Sparkline with latest value",
    Component: Sparkline,
    payload: pressure,
    attributes: { chartLibrary: "dygraph", sparkline: true, ...latestValue },
  },
  {
    label: "Sparkline, warning raised",
    Component: Sparkline,
    payload: withAlerts(pressure, [{ nm: "cpu_some_pressure", wr: 1 }]),
    attributes: { chartLibrary: "dygraph", sparkline: true, ...latestValue },
  },
  {
    label: "Editing a dashboard: move handle",
    Component: Sparkline,
    payload: loadPayload,
    attributes: {
      chartLibrary: "dygraph",
      sparkline: true,
      selectedDimensions: ["load1"],
      toolboxProps: { drag: { "aria-roledescription": "sortable" } },
      ...latestValue,
    },
  },
  {
    label: "Number",
    Component: NumberChart,
    payload: loadPayload,
    attributes: { chartLibrary: "number" },
  },
  {
    label: "Gauge",
    Component: Gauge,
    payload: single({
      context: "modern.cpu.node",
      title: "Avg CPU per node",
      unit: "percentage",
      id: "utilization",
      values: makeWave({ center: 7.6, amplitude: 1.4 }),
    }),
    attributes: { chartLibrary: "gauge", staticValueRange: [0, 100] },
  },
  {
    label: "Ring",
    Component: EasyPie,
    payload: single({
      context: "modern.disk.reads",
      title: "Total disk reads",
      unit: "KiB/s",
      id: "reads",
      values: makeWave({ center: 648, amplitude: 120 }),
    }),
    attributes: { chartLibrary: "easypiechart" },
  },
  {
    label: "Bars",
    Component: Bars,
    payload: loadPayload,
    attributes: { chartLibrary: "bars" },
  },
  {
    label: "Donut",
    Component: D3pie,
    payload: loadPayload,
    attributes: { chartLibrary: "d3pie" },
  },
  {
    label: "No toolbox (dashboard view mode)",
    Component: NumberChart,
    payload: loadPayload,
    attributes: { chartLibrary: "number", hasToolbox: false },
  },
]

const useTileChart = ({ payload, attributes }, theme, designFlavour) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: {
        theme,
        designFlavour,
        expandable: false,
        toolboxElements: [AddToDashboard, Settings, Fullscreen],
      },
    })
    const next = sdk.makeChart({
      getChart: makeMockPayload(payload, { delay: 0 }),
      attributes,
    })
    sdk.appendChild(next)
    return next
  }, [payload, attributes, theme, designFlavour])

  useEffect(() => () => chart.destroy(), [chart])

  return chart
}

const Tile = ({ tile, theme, designFlavour }) => {
  const chart = useTileChart(tile, theme, designFlavour)
  const { Component } = tile

  return (
    <Flex column gap={1} width="300px">
      <TextMicro color="textLite">{tile.label}</TextMicro>
      <Flex height="190px">
        <Component chart={chart} height="100%" width="100%" />
      </Flex>
    </Flex>
  )
}

const Board = ({ theme, designFlavour }) => (
  <Flex column gap={3}>
    <TextSmall strong>{`Tiles (${designFlavour}), hover or tab into a tile`}</TextSmall>
    <Flex gap={4} flexWrap>
      {tiles.map(tile => (
        <Tile
          key={`${tile.label}:${theme}:${designFlavour}`}
          tile={tile}
          theme={theme}
          designFlavour={designFlavour}
        />
      ))}
    </Flex>
  </Flex>
)

const Page = ({ theme, compare }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex column gap={10} padding={[6]} background="mainBackground" width="100%">
      <Board theme={theme} designFlavour="modern" />
      {compare && <Board theme={theme} designFlavour="default" />}
    </Flex>
  </ThemeProvider>
)

export const Light = args => <Page {...args} theme="default" />
Light.args = { compare: false }

export const Dark = args => <Page {...args} theme="dark" />
Dark.args = { compare: false }
Dark.parameters = { netdataTheme: "dark" }

export default {
  title: "Modern/Tiles",
  parameters: { layout: "fullscreen" },
  argTypes: {
    compare: { name: "Show the default flavour below", control: "boolean" },
  },
}
