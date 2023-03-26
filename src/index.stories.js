import React, { useMemo, useState } from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/lib/theme"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Button } from "@netdata/netdata-ui/lib/components/button"
import { camelizeKeys } from "@/helpers/objectTransform"
import Line from "@/components/line"
import NoInteractLine from "@/components/line/noInteract"
import makeMockPayload from "@/helpers/makeMockPayload"
import { useAttribute, useAttributeValue, useChart, withChartProvider } from "@/components/provider"
import makeDefaultSDK from "./makeDefaultSDK"

import noData from "@/fixtures/noData"

import systemLoadLine from "@/fixtures/systemLoadLine"

import systemCpuStacked from "@/fixtures/systemCpuStacked"
import systemCpuStackedChart from "@/fixtures/systemCpuStackedChart"

import systemRamStacked from "@/fixtures/systemRamStacked"
import systemRamStackedChart from "@/fixtures/systemRamStackedChart"

import webLogNginxResponseTimeArea from "@/fixtures/webLogNginxResponseTimeArea"
import webLogNginxResponseTimeAreaChart from "@/fixtures/webLogNginxResponseTimeAreaChart"

import systemIpv6Area from "@/fixtures/systemIpv6Area"
import systemIpv6AreaChart from "@/fixtures/systemIpv6AreaChart"

import systemIpArea from "@/fixtures/systemIpArea"
import systemIpAreaChart from "@/fixtures/systemIpAreaChart"

import appVmsStacked from "@/fixtures/appVmsStacked"
import appVmsStackedChart from "@/fixtures/appVmsStackedChart"

import netOperstate from "@/fixtures/netOperstate"
import netOperstateChart from "@/fixtures/netOperstateChart"

const getChart = makeMockPayload(systemLoadLine[0], { delay: 600 })

export const Simple = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({ getChart })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const Width = () => {
  const [width, setWidth] = useState(false)
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK()
    const chart = sdk.makeChart({ getChart, attributes: { navigation: "selectVertical" } })
    sdk.appendChild(chart)
    return chart
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex column width="500px" gap={4}>
        <Button onClick={() => setWidth(s => !s)} label="Add space" />
        <Flex padding={[0, 0, 0, width ? 12 : 0]}>
          <Line chart={chart} height="315px" />
        </Flex>
      </Flex>
    </ThemeProvider>
  )
}

export const SimpleDark = () => {
  const sdk = makeDefaultSDK({ attributes: { theme: "dark" } })
  const chart = sdk.makeChart({ getChart })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground">
        <Line chart={chart} height="315px" />
      </Flex>
    </ThemeProvider>
  )
}

export const NoData = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart: () => new Promise(r => setTimeout(() => r(noData), 600)),
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

const timezones = ["Pacific/Honolulu", "Europe/Athens", "Asia/Tokyo"]

const TimezonePicker = withChartProvider(() => {
  const [value, setValue] = useAttribute("timezone")
  return (
    <select value={value} onChange={event => setValue(event.target.value)}>
      {timezones.map(timezone => (
        <option value={timezone} key={timezone}>
          {timezone}
        </option>
      ))}
    </select>
  )
})

export const Timezone = () => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK()
    const chart = sdk.makeChart({ getChart, attributes: { timezone: "Pacific/Honolulu" } })
    sdk.appendChild(chart)

    return chart
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <TimezonePicker chart={chart} />
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

const TimePicker = withChartProvider(() => {
  const chart = useChart()
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  const run = after < 0

  return (
    <Flex>
      <input
        type="checkbox"
        checked={run}
        onChange={event => {
          if (event.target.checked) return chart.moveX(-900)
          const now = new Date().getTime() / 1000
          chart.moveX(now - 900, now)
        }}
      />
      <input
        type="date"
        value={run ? "-" : new Date(after * 1000).toISOString().split("T")[0]}
        onChange={event =>
          chart.moveX(event.target.valueAsDate.getTime() / 1000, chart.getAttribute("before"))
        }
        disabled={run}
      />
      <input
        type="date"
        value={run ? "-" : new Date(before * 1000).toISOString().split("T")[0]}
        onChange={event =>
          chart.moveX(chart.getAttribute("after"), event.target.valueAsDate.getTime() / 1000)
        }
        disabled={run}
      />
    </Flex>
  )
})

export const Timepicker = () => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK()
    const chart = sdk.makeChart({ getChart, attributes: {} })
    sdk.appendChild(chart)

    return chart
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <TimePicker chart={chart} />
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const SelectedDimensions = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart,
    attributes: {
      selectedDimensions: ["load5", "load15"],
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const AlertInTimeWindow = () => {
  const sdk = makeDefaultSDK()

  const chart = sdk.makeChart({
    getChart,
    attributes: {
      overlays: {
        alarm: {
          type: "alarm",
          status: "warning",
          value: 538,
          when: Math.floor(Date.now() / 1000 - 5 * 60),
        },
        proceeded: { type: "proceeded" },
      },
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const HighlightInTimeWindow = () => {
  const sdk = makeDefaultSDK()

  const chart = sdk.makeChart({
    getChart,
    attributes: {
      overlays: {
        highlight: {
          type: "highlight",
          range: [Date.now() / 1000 - 5 * 60, Date.now() / 1000 - 4 * 60],
        },
        proceeded: { type: "proceeded" },
      },
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const Timeout = () => {
  let requests = 0
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart: params => {
      if (requests++ % 2 === 1)
        return new Promise(r => setTimeout(() => getChart(params).then(r), 15000))
      return getChart(params)
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const Error = () => {
  let requests = 0
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart: params => {
      if (requests++ % 2 === 1)
        return new Promise((resolve, reject) => setTimeout(() => reject(), 200))
      return getChart(params)
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const InitialLoading = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({ getChart: () => new Promise(() => {}) })
  const darkChart = sdk.makeChart({
    getChart: () => new Promise(() => {}),
    attributes: { theme: "dark" },
  })
  sdk.appendChild(chart)
  sdk.appendChild(darkChart)

  return (
    <div>
      <ThemeProvider theme={DefaultTheme}>
        <Line chart={chart} height="315px" />
      </ThemeProvider>
      <ThemeProvider theme={DarkTheme}>
        <Flex background="mainBackground" margin={[10, 0, 0]}>
          <Line chart={darkChart} height="315px" />
        </Flex>
      </ThemeProvider>
    </div>
  )
}

export const NoInteractions = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({ getChart, attributes: { enabledNavigation: false } })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <NoInteractLine chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export const Multiple = () => {
  const sdk = makeDefaultSDK()

  const charts = Array.from(Array(10)).map((v, index) => {
    const chart = sdk.makeChart({ attributes: { id: index }, getChart })
    sdk.appendChild(chart)

    return chart
  })

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex column gap={2}>
        {charts.map(chart => (
          <Line key={chart.getAttribute("id")} chart={chart} height="315px" />
        ))}
      </Flex>
    </ThemeProvider>
  )
}

export const Sync = () => {
  const sdk = makeDefaultSDK()

  const charts = Array.from(Array(3)).map((v, index) => {
    const chart = sdk.makeChart({ attributes: { id: index, syncHover: index !== 1 }, getChart })
    sdk.appendChild(chart)
    return chart
  })

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex column gap={2}>
        {charts.map(chart => (
          <Line key={chart.getAttribute("id")} chart={chart} height="315px" />
        ))}
      </Flex>
    </ThemeProvider>
  )
}

export default {
  title: "Charts",
  component: Simple,
}
