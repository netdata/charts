import React, { useEffect, useMemo, useRef } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, TextSmall, DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import ChartProvider, { useAttributeValue } from "@/components/provider"
import makeDefaultSDK from "@/makeDefaultSDK"
import makeMockPayload from "@/helpers/makeMockPayload"
import { filterDropdownsPayload } from "../../../fixtures/filterDropdowns"
import FilterToolbox from "./index"
import Nodes from "./nodes"
import Dimensions from "./dimensions"
import Labels from "./labels"
import GroupBy from "./groupBy"
import Aggregate from "./aggregate"
import TimeAggregation from "./timeAggregation"

const useModernChart = theme => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: {
        theme: theme === "dark" ? "dark" : "default",
        designFlavour: "modern",
        contextScope: ["system.load"],
      },
    })
    const chart = sdk.makeChart({
      getChart: makeMockPayload(filterDropdownsPayload, { delay: 0 }),
      attributes: {
        nodesById: {
          "nd-prod-edge-1": { labels: { env: "prod", region: "eu-west" } },
          "nd-prod-db-1": { labels: { env: "prod", region: "us-east" } },
          "nd-staging-1": { labels: { env: "staging", region: "eu-west" } },
        },
      },
    })
    sdk.appendChild(chart)
    chart.doneFetch(filterDropdownsPayload)
    return chart
  }, [theme])

  useEffect(() => () => chart.destroy(), [chart])

  return chart
}

const Loaded = ({ children }) => {
  const loaded = useAttributeValue("loaded")
  return loaded ? children : <TextSmall color="textLite">Loading</TextSmall>
}

const Opened = ({ children }) => {
  const ref = useRef()

  useEffect(() => {
    const trigger = ref.current?.querySelector("[role=button]")
    trigger?.click()
  }, [])

  return <div ref={ref}>{children}</div>
}

const Frame = ({ theme, children }) => {
  const chart = useModernChart(theme)

  return (
    <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
      <ChartProvider chart={chart}>
        <Flex
          column
          gap={4}
          padding={[6]}
          background="mainBackground"
          width="100%"
          height={{ min: "100vh" }}
        >
          <Loaded>{children}</Loaded>
        </Flex>
      </ChartProvider>
    </ThemeProvider>
  )
}

const dropdowns = {
  nodes: Nodes,
  dimensions: Dimensions,
  labels: Labels,
  groupBy: GroupBy,
  aggregate: Aggregate,
  timeAggregation: TimeAggregation,
}

const OpenDropdown = ({ theme, dropdown }) => {
  const Component = dropdowns[dropdown]

  return (
    <Frame key={`${theme}-${dropdown}`} theme={theme}>
      <Opened>
        <Component />
      </Opened>
    </Frame>
  )
}

export const Dropdown = args => <OpenDropdown {...args} />
Dropdown.args = { theme: "light", dropdown: "nodes" }
Dropdown.argTypes = {
  theme: { name: "Theme", control: "radio", options: ["light", "dark"] },
  dropdown: { name: "Dropdown", control: "select", options: Object.keys(dropdowns) },
}

export const NodesLight = () => <OpenDropdown theme="light" dropdown="nodes" />

export const NodesDark = () => <OpenDropdown theme="dark" dropdown="nodes" />
NodesDark.parameters = { netdataTheme: "dark" }

export const AggregateLight = () => <OpenDropdown theme="light" dropdown="aggregate" />

export const AggregateDark = () => <OpenDropdown theme="dark" dropdown="aggregate" />
AggregateDark.parameters = { netdataTheme: "dark" }

export const ToolboxLight = () => (
  <Frame theme="light">
    <FilterToolbox />
  </Frame>
)

export const ToolboxDark = () => (
  <Frame theme="dark">
    <FilterToolbox />
  </Frame>
)
ToolboxDark.parameters = { netdataTheme: "dark" }

export default {
  title: "Modern/Filter dropdowns",
  parameters: { layout: "fullscreen" },
}
