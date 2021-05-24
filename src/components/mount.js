import React from "react"
import ReactDOM from "react-dom"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui/lib/theme/default"
import Chart from "./chart"

export default (chart, element) => {
  ReactDOM.render(
    <ThemeProvider theme={DefaultTheme}>
      <Chart chart={chart} />
    </ThemeProvider>,
    element
  )
}
