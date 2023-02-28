import React from "react"
import { ThemeProvider } from "styled-components"
import { DefaultTheme } from "@netdata/netdata-ui/lib/theme"
import Line from "@/components/line"
import makeDefaultSDK from "./makeDefaultSDK"

const Template = ({ nodesScope, contextScope, contexts, host }) => {
  const sdk = makeDefaultSDK()
  const chart = sdk.makeChart({
    attributes: {
      selectedContexts: [contexts],
      nodesScope: [nodesScope],
      contextScope: [contextScope],
      host: host,
      aggregationMethod: "avg",
      agent: true,
      composite: true,
    },
  })

  sdk.appendChild(chart)

  return (
    <ThemeProvider theme={DefaultTheme}>
      <Line chart={chart} height="315px" />
    </ThemeProvider>
  )
}

export default {
  title: "Agent V2",
  component: OneChart,
  argTypes: {
    host: {
      control: { type: "text" },
    },
    nodesScope: {
      control: { type: "text" },
    },
    contextScope: {
      control: { type: "text" },
    },
    contexts: {
      control: { type: "text" },
    },
  },
}

export const OneChart = Template.bind({})

OneChart.args = {
  nodesScope: "*",
  contextScope: "net.net",
  contexts: "*",
  host: "http://10.10.11.2:19999/api/v2/data", //"http://192.168.1.205:19999/api/v2/data"
}
