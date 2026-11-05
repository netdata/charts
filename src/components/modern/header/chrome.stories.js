import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall } from "@netdata/netdata-ui"
import dashboardIcon from "@netdata/netdata-ui/dist/components/icon/assets/dashboard_add.svg"
import Line from "@/components/line"
import Icon, { Button } from "@/components/icon"
import Settings from "@/components/toolbox/settings"
import Fullscreen from "@/components/toolbox/fullscreen"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import systemLoadLine from "../../../../fixtures/systemLoadLine"

const [loadPayload] = systemLoadLine

const warningPayload = {
  ...loadPayload,
  summary: {
    ...loadPayload.summary,
    alerts: [
      { nm: "load_average_15", wr: 1 },
      { nm: "load_average_5", cl: 1 },
    ],
  },
}

const AddToDashboard = ({ disabled }) => (
  <Button
    icon={<Icon svg={dashboardIcon} size="16px" />}
    title="Add to dashboard"
    disabled={disabled}
  />
)

const nowSec = () => Math.floor(Date.now() / 1000)

const cards = [
  { label: "Within thresholds, consumer action", payload: loadPayload },
  {
    label: "Warning with triggered value",
    payload: warningPayload,
    attributes: () => ({
      overlays: {
        alarm: { type: "alarm", status: "warning", value: 31.86, when: nowSec() - 5 * 60 },
      },
    }),
  },
  {
    label: "Zoomed, filters open",
    payload: loadPayload,
    attributes: () => ({ after: nowSec() - 12 * 60, before: nowSec() - 4 * 60, filtersOpen: true }),
  },
  {
    label: "No toolbox, two dimensions hidden",
    payload: loadPayload,
    attributes: () => ({ hasToolbox: false, selectedLegendDimensions: ["load1"] }),
  },
  { label: "Default flavour, for comparison", payload: loadPayload, flavour: "default" },
]

const useCard = ({ payload, attributes, flavour = "modern" }, theme) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({
      attributes: {
        theme,
        designFlavour: flavour,
        chartLibrary: "uplot",
        toolboxElements: [AddToDashboard, Settings, Fullscreen],
      },
    })
    const next = sdk.makeChart({
      getChart: makeMockPayload(payload, { delay: 0 }),
      attributes: { chartType: "line", ...(attributes && attributes()) },
    })
    sdk.appendChild(next)
    return next
  }, [payload, attributes, flavour, theme])

  useEffect(() => () => chart.destroy(), [chart])

  return chart
}

const Card = ({ card, theme }) => {
  const chart = useCard(card, theme)

  return (
    <Flex column gap={1} width="640px">
      <TextSmall color="textLite">{card.label}</TextSmall>
      <Flex height="300px" background="mainChartBg" round={1}>
        <Line chart={chart} height="100%" width="100%" />
      </Flex>
    </Flex>
  )
}

const Page = ({ theme }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex gap={6} padding={[6]} flexWrap background="mainBackground" width="100%">
      {cards.map(card => (
        <Card key={`${card.label}:${theme}`} card={card} theme={theme} />
      ))}
    </Flex>
  </ThemeProvider>
)

export const Light = () => <Page theme="default" />

export const Dark = () => <Page theme="dark" />
Dark.parameters = { netdataTheme: "dark" }

export default {
  title: "Modern/Chart card chrome",
  parameters: { layout: "fullscreen" },
}
