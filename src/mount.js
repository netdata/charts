import React from "react"
import { createRoot } from "react-dom/client"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui"
import Line from "./components/line"

export default (chart, element) => {
  createRoot(element).render(
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} />
    </ThemeProvider>
  )
}
