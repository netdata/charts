import React from "react"
import { render } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui"
import ChartProvider from "@/components/provider"
import { makeTestChart } from "./makeTestChart"

export const renderWithChart = (
  component,
  { theme = DefaultTheme, testChartOptions = {}, ...otherOptions } = {}
) => {
  let chart = testChartOptions.chart

  if (!chart) {
    const result = makeTestChart(testChartOptions)
    chart = result.chart
  }

  const TestWrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      <ChartProvider chart={chart}>{children}</ChartProvider>
    </ThemeProvider>
  )

  const user = userEvent.setup()
  const renderResult = render(component, { wrapper: TestWrapper, ...otherOptions })
  return { ...renderResult, chart, user }
}

export const renderHookWithChart = (
  hook,
  { theme = DefaultTheme, testChartOptions = {}, ...otherOptions } = {}
) => {
  let chart = testChartOptions.chart

  if (!chart) {
    const result = makeTestChart(testChartOptions)
    chart = result.chart
  }

  const TestWrapper = ({ children }) => (
    <ThemeProvider theme={theme}>
      <ChartProvider chart={chart}>{children}</ChartProvider>
    </ThemeProvider>
  )

  const hookResult = renderHook(hook, { wrapper: TestWrapper, ...otherOptions })
  return { ...hookResult, chart }
}

export const renderWithProviders = (component, { theme = DefaultTheme, ...renderOptions } = {}) => {
  const Providers = ({ children }) => <ThemeProvider theme={theme}>{children}</ThemeProvider>

  return render(component, {
    wrapper: Providers,
    ...renderOptions,
  })
}
