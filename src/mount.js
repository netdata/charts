import React from "react"
import ReactDOM from "react-dom"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui/lib/theme/default"
import Line from "./components/line"

export default (chart, element) => {
  ReactDOM.render(
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} />
    </ThemeProvider>,
    element
  )
}
