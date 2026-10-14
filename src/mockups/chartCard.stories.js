import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import systemLoadLine from "../../fixtures/systemLoadLine"
import { FontLink } from "./primitives"
import { ChartCard, Ground, themes } from "./chartCard"

const themeArg = {
  args: { theme: "light" },
  argTypes: { theme: { control: "radio", options: ["light", "dark"] } },
}

const Caption = ({ theme, children }) => (
  <div
    style={{
      gridColumn: "1 / -1",
      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      fontSize: 15,
      fontWeight: 600,
      color: themes[theme].ink,
      marginTop: 8,
    }}
  >
    {children}
  </div>
)

const CurrentChart = ({ theme }) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: {
        theme: theme === "dark" ? "dark" : "default",
        navigation: "pan",
        expandable: false,
      },
    })
    const made = sdk.makeChart({
      getChart: makeMockPayload(systemLoadLine[0], { delay: 0 }),
      attributes: { chartLibrary: "uplot", chartType: "line" },
    })
    sdk.appendChild(made)
    return made
  }, [theme])
  useEffect(() => () => chart.destroy(), [chart])

  return (
    <figure
      style={{
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
      }}
    >
      <figcaption style={{ fontSize: 13, color: themes[theme].muted }}>
        Today: the real chart, uPlot renderer
      </figcaption>
      <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
        <Flex width="640px" height="340px" background="mainChartBg">
          <Line chart={chart} height="100%" width="100%" />
        </Flex>
      </ThemeProvider>
    </figure>
  )
}

export const Chrome = ({ theme }) => (
  <Ground theme={theme}>
    <FontLink />
    <CurrentChart theme={theme} />
    <ChartCard
      theme={theme}
      caption="Proposed: actions appear on hover, filters fold into one scope line, no floating toolbar"
    />
  </Ground>
)
Object.assign(Chrome, themeArg)

export const LegendRecipes = ({ theme }) => (
  <Ground theme={theme}>
    <FontLink />
    <Caption theme={theme}>A few series (3)</Caption>
    <ChartCard theme={theme} legend="below" caption="1. Below, one compact line" />
    <ChartCard
      theme={theme}
      legend="direct"
      caption="2. Direct labels at the line ends, no legend box"
    />
    <ChartCard theme={theme} legend="right" caption="3. Side table with Last, Mean, Max" />
    <ChartCard
      theme={theme}
      legend="hidden"
      caption="4. Hidden: small grid tiles, values only on hover"
    />
    <Caption theme={theme}>Many series (12)</Caption>
    <ChartCard
      theme={theme}
      dataset="disks"
      legend="below"
      caption="Below: first 8, then +N more"
    />
    <ChartCard
      theme={theme}
      dataset="disks"
      legend="right"
      caption="Side table: sorted by value, scrolls"
    />
  </Ground>
)
Object.assign(LegendRecipes, themeArg)

export const HoverRecipes = ({ theme }) => (
  <Ground theme={theme}>
    <FontLink />
    <Caption theme={theme}>Hover each chart</Caption>
    <ChartCard
      theme={theme}
      hoverMode="tooltip"
      caption="A. Compact tooltip: sorted, 6 rows max, flips away from the cursor"
    />
    <ChartCard
      theme={theme}
      hoverMode="legend"
      legend="below"
      caption="B. No tooltip: the legend becomes the readout"
    />
    <ChartCard
      theme={theme}
      hoverMode="labels"
      caption="C. Values pinned next to each point on the crosshair"
    />
    <ChartCard
      theme={theme}
      hoverMode="legend"
      legend="right"
      caption="B with a side table: nothing covers the plot"
    />
    <Caption theme={theme}>Same recipes with 12 series</Caption>
    <ChartCard theme={theme} dataset="disks" hoverMode="tooltip" caption="A. Tooltip" />
    <ChartCard
      theme={theme}
      dataset="disks"
      hoverMode="legend"
      legend="right"
      caption="B. Side table as readout"
    />
  </Ground>
)
Object.assign(HoverRecipes, themeArg)

export const Playground = args => (
  <Ground theme={args.theme} columns={1}>
    <FontLink />
    <ChartCard {...args} width={900} height={240} />
  </Ground>
)
Playground.args = {
  theme: "light",
  dataset: "load",
  legend: "below",
  hoverMode: "tooltip",
  chrome: "quiet",
}
Playground.argTypes = {
  theme: { control: "radio", options: ["light", "dark"] },
  dataset: { control: "radio", options: ["load", "disks"] },
  legend: { control: "radio", options: ["below", "direct", "right", "table", "hidden"] },
  hoverMode: { control: "radio", options: ["tooltip", "legend", "labels"] },
}

export default {
  title: "Mockups/Chart card",
  parameters: { layout: "fullscreen" },
}
