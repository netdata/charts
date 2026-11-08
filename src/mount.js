import React, { useCallback, useSyncExternalStore } from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "styled-components"
import { DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import Line from "./components/line"

const themes = [DefaultTheme, DarkTheme]

const StandaloneChart = ({ chart }) => {
  const subscribe = useCallback(listener => chart.onAttributeChange("theme", listener), [chart])
  const themeIndex = useSyncExternalStore(subscribe, chart.getThemeIndex)

  return (
    <ThemeProvider theme={themes[themeIndex]}>
      <Line chart={chart} />
    </ThemeProvider>
  )
}

export default (chart, element) => {
  const root = createRoot(element)
  root.render(<StandaloneChart chart={chart} />)
  return root
}
