import React from "react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme, DarkTheme } from "@netdata/netdata-ui"
import Line from "@/components/line"
import Gauge from "@/components/gauge"
import EasyPie from "@/components/easyPie"
import D3pie from "@/components/d3pie"
import GroupBoxes from "@/components/groupBoxes"
import makeDefaultSDK from "@/makeDefaultSDK"

const kinds = [
  { Component: Line, chartLibrary: "dygraph", width: "100%", height: "260px" },
  { Component: Gauge, chartLibrary: "gauge", width: "220px", height: "220px" },
  { Component: EasyPie, chartLibrary: "easypiechart", width: "220px", height: "220px" },
  { Component: D3pie, chartLibrary: "d3pie", width: "220px", height: "220px" },
  { Component: GroupBoxes, chartLibrary: "groupBoxes", width: "100%", height: "120px" },
]

const Loading = ({ designFlavour, theme }) => {
  const sdk = makeDefaultSDK({ attributes: { designFlavour, theme } })

  return (
    <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
      <Flex column gap={4} padding={[4]} background="mainBackground">
        {kinds.map(({ Component, chartLibrary, width, height }) => {
          const chart = sdk.makeChart({
            getChart: () => new Promise(() => {}),
            attributes: { contextScope: ["system.load"], chartLibrary, id: chartLibrary },
          })
          sdk.appendChild(chart)
          return <Component key={chartLibrary} chart={chart} width={width} height={height} />
        })}
      </Flex>
    </ThemeProvider>
  )
}

export const Skeletons = ({ designFlavour, theme }) => (
  <Loading key={`${designFlavour}-${theme}`} designFlavour={designFlavour} theme={theme} />
)
Skeletons.args = { designFlavour: "modern", theme: "dark" }
Skeletons.argTypes = {
  designFlavour: { control: "radio", options: ["default", "modern"] },
  theme: { control: "radio", options: ["dark", "light"] },
}

export default {
  title: "Skeletons",
  parameters: { layout: "fullscreen" },
}
