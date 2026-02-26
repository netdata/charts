import React, { useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import GaugeComponent from "@/components/gauge"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "../../makeDefaultSDK"
import systemLoadLine from "../../../fixtures/systemLoadLine"

const getChart = makeMockPayload(systemLoadLine[0], { delay: 600 })

export const Default = () => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK()
    const c = sdk.makeChart({
      getChart,
      attributes: {
        contextScope: ["system.load"],
        chartLibrary: "gauge",
      },
    })
    sdk.appendChild(c)
    return c
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="300px" height="200px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const WithGradient = () => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK()
    const c = sdk.makeChart({
      getChart,
      attributes: {
        contextScope: ["system.load"],
        chartLibrary: "gauge",
        gaugeGradient: true,
      },
    })
    sdk.appendChild(c)
    return c
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="300px" height="200px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const GradientWithThinArc = () => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK()
    const c = sdk.makeChart({
      getChart,
      attributes: {
        contextScope: ["system.load"],
        chartLibrary: "gauge",
        gaugeGradient: true,
        gaugeLineWidth: 0.05,
      },
    })
    sdk.appendChild(c)
    return c
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="300px" height="200px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const ThinArc = () => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK()
    const c = sdk.makeChart({
      getChart,
      attributes: {
        contextScope: ["system.load"],
        chartLibrary: "gauge",
        gaugeLineWidth: 0.05,
        gaugeGradient: true,
      },
    })
    sdk.appendChild(c)
    return c
  }, [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="300px" height="200px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const DarkMode = () => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({ attributes: { theme: "dark" } })
    const c = sdk.makeChart({
      getChart,
      attributes: {
        contextScope: ["system.load"],
        chartLibrary: "gauge",
        gaugeGradient: true,
      },
    })
    sdk.appendChild(c)
    return c
  }, [])

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground" width="300px" height="200px">
        <GaugeComponent chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export default {
  title: "Charts/Gauge",
  component: Default,
}
