import React, { useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import "uplot/dist/uPlot.min.css"
import ChartContainer from "@/components/chartContainer"
import withChart from "@/components/hocs/withChart"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "../../makeDefaultSDK"
import systemLoadLine from "../../../fixtures/systemLoadLine"
import uplot from "./index"

const getChart = makeMockPayload(systemLoadLine[0], { delay: 600 })

const UplotChart = withChart(({ uiName, ...rest }) => <ChartContainer uiName={uiName} {...rest} />)

const makeChart = ({ theme, ...attributes } = {}) => {
  const sdk = makeDefaultSDK(theme ? { attributes: { theme } } : undefined)
  sdk.addUI("uplot", uplot)
  const chart = sdk.makeChart({
    getChart,
    attributes: { contextScope: ["system.load"], chartLibrary: "uplot", ...attributes },
  })
  sdk.appendChild(chart)
  return chart
}

export const Line = () => {
  const chart = useMemo(() => makeChart({ chartType: "line" }), [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="800px" height="300px">
        <UplotChart chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const Area = () => {
  const chart = useMemo(() => makeChart({ chartType: "area" }), [])

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Flex width="800px" height="300px">
        <UplotChart chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

export const DarkMode = () => {
  const chart = useMemo(() => makeChart({ chartType: "line", theme: "dark" }), [])

  return (
    <ThemeProvider theme={DarkTheme}>
      <Flex background="mainBackground" width="800px" height="300px">
        <UplotChart chart={chart} />
      </Flex>
    </ThemeProvider>
  )
}

DarkMode.parameters = { netdataTheme: "dark" }

export default {
  title: "Charts/uPlot (spike)",
  component: Line,
}
