import React, { useState, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui/lib/theme"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { Button } from "@netdata/netdata-ui/lib/components/button"
import EasyPie from "@/components/easyPie"
import GaugeComponent from "@/components/gauge"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "./makeDefaultSDK"

import systemIoInGaugePie from "../fixtures/systemIoInGaugePie"

const getChart = makeMockPayload(systemIoInGaugePie, { delay: 600 })

export const Simple = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart,
    attributes: { updateEvery: 1, chartLibrary: "easypiechart" },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="100px">
        <EasyPie chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const SimplePercentage = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart,
    attributes: { updateEvery: 1, chartLibrary: "easypiechart", units: "percentage" },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="100px">
        <EasyPie chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const Width = () => {
  const [width, setWidth] = useState(false)
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK()
    const chart = sdk.makeChart({
      getChart,
      attributes: { updateEvery: 1, chartLibrary: "easypiechart" },
    })
    sdk.appendChild(chart)
    return chart
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex column width={width ? "500px" : "300px"} gap={4}>
        <Button onClick={() => setWidth(s => !s)} label="Add space" />
        <EasyPie chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const SimpleDark = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart,
    attributes: { updateEvery: 1, chartLibrary: "easypiechart", theme: "dark" },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground" width="100px">
        <EasyPie chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const InitialLoading = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({ getChart: () => new Promise(() => {}) })
  const darkChart = sdk.makeChart({
    getChart: () => new Promise(() => {}),
    attributes: { chartLibrary: "easypiechart" },
  })
  sdk.appendChild(chart)
  sdk.appendChild(darkChart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="100px">
        <EasyPie chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const GaugePercent = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart,
    attributes: { updateEvery: 1, chartLibrary: "gauge", units: "percentage" },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="180px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const GaugeWidth = () => {
  const [width, setWidth] = useState(false)
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK()
    const chart = sdk.makeChart({
      getChart,
      attributes: { updateEvery: 1, chartLibrary: "gauge", units: "percentage" },
    })
    sdk.appendChild(chart)
    return chart
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex column width={width ? "500px" : "300px"} gap={4}>
        <Button onClick={() => setWidth(s => !s)} label="Add space" />
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const Gauge = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    getChart,
    attributes: { updateEvery: 1, chartLibrary: "gauge" },
  })
  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="180px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const GaugeInitialLoading = () => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({ getChart: () => new Promise(() => {}) })
  const darkChart = sdk.makeChart({
    getChart: () => new Promise(() => {}),
    attributes: { chartLibrary: "gauge" },
  })
  sdk.appendChild(chart)
  sdk.appendChild(darkChart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="100px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export default {
  title: "GaugePie",
  component: Simple,
}
