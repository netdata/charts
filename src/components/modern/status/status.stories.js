import React from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme, TextSmall } from "@netdata/netdata-ui"
import StatusIndicator, { getClearDescription } from "./index"

const states = [
  { label: "No alerts configured", props: { status: null } },
  { label: "All clear", props: { status: "clear", description: getClearDescription(3) } },
  { label: "Warning", props: { status: "warning", count: 1, names: ["load_average_15"] } },
  {
    label: "Critical",
    props: { status: "critical", count: 2, names: ["disk_space_usage", "inodes_usage"] },
  },
  {
    label: "Critical, many alerts",
    props: {
      status: "critical",
      count: 8,
      names: ["a_one", "b_two", "c_three", "d_four", "e_five", "f_six", "g_seven", "h_eight"],
    },
  },
  { label: "Raised by an overlay, no count", props: { status: "warning" } },
]

const Grid = ({ theme }) => (
  <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
    <Flex background="mainBackground" padding={[6]} gap={4} flexWrap>
      {states.map(({ label, props }) => (
        <Flex key={label} column gap={2}>
          <TextSmall color="textLite">{label}</TextSmall>
          <Flex
            width="220px"
            height="56px"
            background="mainChartBg"
            round
            padding={[2, 3]}
            justifyContent="end"
            alignItems="start"
            data-testid="modernStatusStory-card"
          >
            <StatusIndicator {...props} />
          </Flex>
        </Flex>
      ))}
    </Flex>
  </ThemeProvider>
)

export const Light = () => <Grid theme="default" />

export const Dark = () => <Grid theme="dark" />

Dark.parameters = { netdataTheme: "dark" }

export default {
  title: "Modern/Status",
  component: Light,
}
