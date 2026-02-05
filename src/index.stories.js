import React, { useMemo, useState } from "react"
import { ThemeProvider } from "styled-components"
import { Button, Flex, DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import Line from "@/components/line"
import AlertTimeline from "@/components/alertTimeline"
import HeadlessChart from "@/components/headlessChart"
import makeMockPayload from "@/helpers/makeMockPayload"
import { useAttribute, useAttributeValue, useChart, withChartProvider } from "@/components/provider"
import makeDefaultSDK from "./makeDefaultSDK"

import noData from "../fixtures/noData"

import systemLoadLine from "../fixtures/systemLoadLine"

const getChart = makeMockPayload(systemLoadLine[0], { delay: 600 })

export const Simple = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart,
    attributes: { contextScope: ["system.load"] },
  })
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
    const chart = sdk.makeChart({
      getChart,
      attributes: { contextScope: ["system.load"], navigation: "selectVertical" },
    })
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
  const sdk = makeDefaultSDK({ attributes: { contextScope: ["system.load"], theme: "dark" } })
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
    attributes: { contextScope: ["system.load"] },
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
    const chart = sdk.makeChart({
      getChart,
      attributes: { contextScope: ["system.load"], timezone: "Pacific/Honolulu" },
    })
    sdk.appendChild(chart)

    return chart
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex column>
        <TimezonePicker chart={chart} />
        <Line chart={chart} height="315px" />
      </Flex>
    </ThemeProvider>
  )
}

const TimePicker = withChartProvider(() => {
  const chart = useChart()
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  const run = after < 0

  return (
    <Flex alignItems="start">
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
    const chart = sdk.makeChart({ getChart, attributes: { contextScope: ["system.load"] } })
    sdk.appendChild(chart)

    return chart
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex column>
        <TimePicker chart={chart} />
        <Line chart={chart} height="315px" />
      </Flex>
    </ThemeProvider>
  )
}

export const SelectedDimensions = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart,
    attributes: {
      contextScope: ["system.load"],
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

export const AlertTransitions = () => {
  const sdk = makeDefaultSDK()
  const now = Math.floor(Date.now() / 1000)

  const chart = sdk.makeChart({
    getChart,
    attributes: {
      overlays: {
        alertTransitions: {
          type: "alertTransitions",
          transitions: [
            {
              timestamp: now - 12 * 60,
              from: "CLEAR",
              to: "WARNING",
              value: 75.5,
            },
            {
              timestamp: now - 9 * 60,
              from: "WARNING",
              to: "CRITICAL",
              value: 92.3,
            },
            {
              timestamp: now - 6 * 60,
              from: "CRITICAL",
              to: "WARNING",
              value: 78.1,
            },
            {
              timestamp: now - 3 * 60,
              from: "WARNING",
              to: "CLEAR",
              value: 45.0,
            },
          ],
        },
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

export const AlertTransitionsDark = () => {
  const sdk = makeDefaultSDK({ attributes: { theme: "dark" } })
  const now = Math.floor(Date.now() / 1000)

  const chart = sdk.makeChart({
    getChart,
    attributes: {
      overlays: {
        alertTransitions: {
          type: "alertTransitions",
          transitions: [
            {
              timestamp: now - 10 * 60,
              from: "CLEAR",
              to: "CRITICAL",
              value: 95.0,
            },
            {
              timestamp: now - 5 * 60,
              from: "CRITICAL",
              to: "CLEAR",
              value: 30.0,
            },
          ],
        },
      },
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground">
        <Line chart={chart} height="315px" />
      </Flex>
    </ThemeProvider>
  )
}

const alertTransitionsData = [
  { timestamp: -12 * 60, from: "CLEAR", to: "WARNING", value: 75.5 },
  { timestamp: -9 * 60, from: "WARNING", to: "CRITICAL", value: 92.3 },
  { timestamp: -6 * 60, from: "CRITICAL", to: "WARNING", value: 78.1 },
  { timestamp: -3 * 60, from: "WARNING", to: "CLEAR", value: 45.0 },
]

export const AlertTransitionsWithTimeline = () => {
  const sdk = makeDefaultSDK({ attributes: { theme: "dark", syncHover: true } })
  const now = Math.floor(Date.now() / 1000)

  const transitions = alertTransitionsData.map(t => ({
    ...t,
    timestamp: now + t.timestamp,
  }))

  const chart = sdk.makeChart({
    getChart,
    attributes: {
      overlays: {
        alertTransitions: {
          type: "alertTransitions",
          transitions,
        },
      },
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground" column width="600px">
        <HeadlessChart chart={chart}>
          <AlertTimeline />
        </HeadlessChart>
        <Line chart={chart} height="315px" />
      </Flex>
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
    attributes: {
      contextScope: ["system.load"],
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
    attributes: {
      contextScope: ["system.load"],
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
  const chart = sdk.makeChart({
    getChart: () => new Promise(() => {}),
    attributes: { contextScope: ["system.load"] },
  })
  const darkChart = sdk.makeChart({
    getChart: () => new Promise(() => {}),
    attributes: { contextScope: ["system.load"], theme: "dark" },
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

export const Multiple = () => {
  const sdk = makeDefaultSDK()

  const charts = Array.from(Array(10)).map((v, index) => {
    const chart = sdk.makeChart({
      attributes: { contextScope: ["system.load"], id: `chart-${index}` },
      getChart,
    })
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
    const chart = sdk.makeChart({
      attributes: { contextScope: ["system.load"], id: `chart-${index}`, syncHover: index !== 1 },
      getChart,
    })
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

export const WithAnnotations = () => {
  const sdk = makeDefaultSDK()

  const chart = sdk.makeChart({
    getChart,
    attributes: {
      contextScope: ["system.load"],
      hasCorrelation: true, // Enable correlation buttons
      overlays: {
        annotation1: {
          type: "annotation",
          timestamp: Math.floor(Date.now() / 1000 - 10 * 60), // 10 minutes ago
          text: "Deployment started",
          author: "DevOps Team",
          created: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          color: "#00AB44",
          position: "top",
        },
        annotation2: {
          type: "annotation",
          timestamp: Math.floor(Date.now() / 1000 - 5 * 60), // 5 minutes ago
          text: "CPU spike detected - investigating root cause",
          author: "Backend Team",
          created: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          color: "#ff6b6b",
          position: "bottom",
        },
        annotation3: {
          type: "annotation",
          timestamp: Math.floor(Date.now() / 1000 - 2 * 60), // 2 minutes ago
          text: "Issue resolved",
          author: "SRE Team",
          created: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          color: "#0075F2",
          position: "top",
        },
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

export const AnnotationCreation = () => {
  const sdk = makeDefaultSDK()

  const chart = sdk.makeChart({
    getChart,
    attributes: {
      contextScope: ["system.load"],
      hasCorrelation: true,
    },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <div>
        <p style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
          Click anywhere on the chart to create a new annotation
        </p>
        <Line chart={chart} height="315px" />
      </div>
    </ThemeProvider>
  )
}

export const CrossChartAnnotationSync = () => {
  const sdk = makeDefaultSDK()

  const charts = Array.from(Array(3)).map((v, index) => {
    const chart = sdk.makeChart({
      attributes: {
        contextScope: ["system.load"],
        id: `chart-${index}`,
        hasCorrelation: true,
        overlays:
          index === 0
            ? {
                annotation1: {
                  type: "annotation",
                  timestamp: Math.floor(Date.now() / 1000 - 8 * 60),
                  text: "Performance issue detected",
                  author: "SRE Team",
                  created: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
                  color: "#ff6b6b",
                  priority: "error",
                },
              }
            : {},
      },
      getChart,
    })
    sdk.appendChild(chart)
    return chart
  })

  return (
    <ThemeProvider theme={DefaultTheme}>
      <div>
        <p style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
          Hover the annotation on the first chart and click "Sync all charts" to see cross-chart
          synchronization. Synced annotations appear with dashed borders and different actions.
        </p>
        <Flex column gap={2}>
          {charts.map((chart, index) => (
            <div key={chart.getAttribute("id")}>
              <h4 style={{ margin: "10px 0 5px", fontSize: "12px", color: "#888" }}>
                Chart {index + 1} (ID: {chart.getAttribute("id")})
              </h4>
              <Line chart={chart} height="200px" />
            </div>
          ))}
        </Flex>
      </div>
    </ThemeProvider>
  )
}

export default {
  title: "Charts",
  component: Simple,
}
