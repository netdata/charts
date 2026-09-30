import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Table from "@/components/table"
import GroupBoxes from "@/components/groupBoxes"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import makeHeatPayload from "@/components/modern/groupBoxes/makeHeatPayload"
import tableFixture from "../../../../fixtures/table"

// Two nodes raise alerts so the status dots show every state.
const makeTablePayload = () => {
  const payload = JSON.parse(JSON.stringify(tableFixture[0]))
  const [, warning, critical] = payload.summary.nodes
  if (warning) warning.al = { cl: 3, wr: 1 }
  if (critical) critical.al = { cl: 2, wr: 1, cr: 1 }
  return payload
}

const tablePayload = makeTablePayload()
const heatPayload = makeHeatPayload()

const cases = [
  {
    id: "table",
    title: "Disk activity",
    description: "Status dots, meters in percentage cells, trends in the rest.",
    Component: Table,
    payload: tablePayload,
    height: "520px",
    attributes: {
      chartLibrary: "table",
      contextScope: ["disk.io", "disk.ops", "disk.await", "disk.util"],
      tableColumns: ["context", "dimension"],
      tableSortBy: [{ id: "labelNode2", desc: false }],
    },
  },
  {
    id: "group-boxes",
    title: "Node CPU",
    description: "One hue, light to dark; boxes at or above 90% use the error colour.",
    Component: GroupBoxes,
    payload: heatPayload,
    height: "420px",
    attributes: {
      chartLibrary: "groupBoxes",
      contextScope: ["modern.nodes.cpu"],
      groupBoxesThreshold: 90,
    },
  },
]

const useCaseChart = ({ id, payload, attributes }, theme, designFlavour) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: { theme, designFlavour, navigation: "pan", expandable: false },
    })
    const made = sdk.makeChart({
      getChart: makeMockPayload(payload, { delay: 0 }),
      attributes: { id: `modern-${id}-${theme}-${designFlavour}`, ...attributes },
    })
    sdk.appendChild(made)
    return made
  }, [id, payload, attributes, theme, designFlavour])

  useEffect(() => () => chart.destroy(), [chart])

  return chart
}

const Case = ({ item, theme, designFlavour }) => {
  const chart = useCaseChart(item, theme, designFlavour)
  const { Component, title, description, height } = item

  return (
    <Flex column gap={2} width="100%">
      <Flex column gap={1}>
        <TextSmall strong>{title}</TextSmall>
        <TextMicro color="textDescription">{description}</TextMicro>
      </Flex>
      <Flex
        height={height}
        background="mainChartBg"
        round={3}
        border={{ color: "mainChartBorder" }}
      >
        <Component chart={chart} height="100%" width="100%" />
      </Flex>
    </Flex>
  )
}

const Page = ({ theme, designFlavour = "modern" }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex column gap={8} padding={[6]} background="mainBackground" width="100%">
      {cases.map(item => (
        <Case key={`${item.id}:${theme}`} item={item} theme={theme} designFlavour={designFlavour} />
      ))}
    </Flex>
  </ThemeProvider>
)

export const Light = () => <Page theme="default" />

export const Dark = () => <Page theme="dark" />

export const DefaultFlavourForComparison = () => <Page theme="default" designFlavour="default" />

export default {
  title: "Modern/Table and group boxes",
  component: Light,
}
