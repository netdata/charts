import { useEffect, useMemo, useState } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall, TextMicro } from "@netdata/netdata-ui"
import Line from "@/components/line"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import { makeAlertsMenu, parseThresholds, thresholdOverlayId } from "."

const basePayload = makePayload({
  context: "system.cpu",
  title: "Total CPU utilization",
  unit: "percentage",
  dimensions: [
    { id: "user", values: makeWave({ center: 38, amplitude: 14, cycles: 2 }) },
    { id: "system", values: makeWave({ center: 14, amplitude: 4, cycles: 3, phase: 1.2 }) },
    { id: "iowait", values: makeWave({ center: 6, amplitude: 3, cycles: 4, phase: 2.1 }) },
  ],
})

const withAlerts = (payload, alerts) => ({ ...payload, summary: { ...payload.summary, alerts } })

const raisedPayload = withAlerts(basePayload, [
  { nm: "cpu_usage", wr: 1, cl: 2 },
  { nm: "cpu_iowait", cl: 3 },
  { nm: "cpu_steal_ratio", cl: 3 },
  { nm: "system_cpu_pressure", cr: 1 },
])

const clearPayload = withAlerts(basePayload, [
  { nm: "cpu_usage", cl: 3 },
  { nm: "cpu_iowait", cl: 3 },
])

const definitions = {
  cpu_usage: {
    warn: "$this > (($status >= $WARNING) ? (40) : (45))",
    crit: "$this > (($status >= $WARNING) ? (50) : (55))",
    evaluates: "Average of user + system over the last 10 minutes",
    plotted: false,
  },
  cpu_iowait: {
    warn: "$this > 15",
    crit: "$this > 25",
    evaluates: "Average of iowait over the last 10 minutes",
    plotted: true,
  },
  cpu_steal_ratio: {
    warn: "$this > $green",
    crit: "$this > $red",
    evaluates: "Steal as a share of total CPU, compared with node variables",
    plotted: true,
  },
  system_cpu_pressure: {
    warn: "$this > (($status >= $WARNING) ? (5) : (10))",
    crit: "$this > (($status == $CRITICAL) ? (15) : (20))",
    evaluates: "Pressure stall, a different metric than this chart",
    plotted: false,
  },
}

const record = (chart, text) => chart.trigger("storyAction", text)

const getAlertDefinition = ({ name }) => definitions[name] || null

const useAlertActions = ({ chart, name }) => [
  {
    id: "details",
    label: "View instances and values",
    onClick: () => record(chart, `Alert details modal for ${name}`),
  },
  {
    id: "edit",
    label: "Edit configuration",
    onClick: () => record(chart, `Dyncfg editor for ${name}`),
  },
  {
    id: "silence",
    label: "Silence…",
    onClick: () => record(chart, `Silencing rule form prefilled with ${name}`),
  },
]

const useChartActions = ({ chart }) => [
  {
    id: "add",
    label: "New alert for this chart…",
    onClick: () => record(chart, "Alert configuration modal for system.cpu"),
  },
  {
    id: "open",
    label: "Open in Alerts",
    onClick: () => record(chart, "Alerts tab filtered by system.cpu"),
  },
]

const AlertsMenuElement = () => null
AlertsMenuElement.menu = makeAlertsMenu({
  useAlertDefinition: getAlertDefinition,
  useAlertActions,
  useChartActions,
})

const iowaitLevels = parseThresholds(definitions.cpu_iowait)

const stories = {
  raised: {
    label: "Click the status pill: raised alerts first, then the ones that watch, open one",
    payload: raisedPayload,
  },
  levels: {
    label: "cpu_iowait levels on the chart, the y range grows to keep them visible",
    payload: raisedPayload,
    attributes: {
      overlays: {
        [thresholdOverlayId]: { type: "threshold", alert: "cpu_iowait", ...iowaitLevels },
      },
    },
  },
  dygraph: {
    label: "dygraph renderer: the menu works, levels on chart are disabled",
    payload: raisedPayload,
    chartLibrary: "dygraph",
  },
  clear: {
    label: "All clear: the quiet pill still opens the list",
    payload: clearPayload,
  },
  empty: {
    label: "No alert on these metrics",
    payload: basePayload,
  },
}

const useCard = ({ payload, attributes, chartLibrary = "uplot" }, theme) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: {
        theme,
        designFlavour: "modern",
        chartLibrary,
        toolboxElements: [AlertsMenuElement],
      },
    })
    const next = sdk.makeChart({
      getChart: makeMockPayload(payload, { delay: 0 }),
      attributes: { chartType: "line", ...attributes },
    })
    sdk.appendChild(next)
    return next
  }, [payload, attributes, chartLibrary, theme])

  useEffect(() => () => chart.destroy(), [chart])

  return chart
}

const LastAction = ({ chart }) => {
  const [text, setText] = useState(null)
  useEffect(() => chart.on("storyAction", setText), [chart])
  return <TextMicro color="textLite">{text ? `Would open: ${text}` : " "}</TextMicro>
}

const Card = ({ story, theme }) => {
  const chart = useCard(story, theme)

  return (
    <Flex column gap={1} width="640px">
      <TextSmall color="textLite">{story.label}</TextSmall>
      <Flex height="300px" background="mainChartBg" round={1}>
        <Line chart={chart} height="100%" width="100%" />
      </Flex>
      <LastAction chart={chart} />
    </Flex>
  )
}

const Page = ({ story, theme }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex padding={[6]} background="mainBackground" width="100%" height={{ min: "720px" }}>
      <Card key={theme} story={stories[story]} theme={theme} />
    </Flex>
  </ThemeProvider>
)

const make = story => {
  const Story = ({ theme }) => <Page story={story} theme={theme} />
  Story.args = { theme: "default" }
  Story.argTypes = { theme: { name: "Theme", control: "radio", options: ["default", "dark"] } }
  return Story
}

export const Raised = make("raised")
export const LevelsOnChart = make("levels")
export const Dygraph = make("dygraph")
export const AllClear = make("clear")
export const Empty = make("empty")

export default {
  title: "Modern/Alerts menu",
  parameters: { layout: "fullscreen" },
}
