import React, { useEffect, useMemo } from "react"
import { ThemeProvider } from "styled-components"
import { DarkTheme, DefaultTheme, Flex } from "@netdata/netdata-ui"
import GroupBoxes from "@/components/groupBoxes"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "@/makeDefaultSDK"
import makeHeatPayload from "../../../../fixtures/makeHeatPayload"

const payload = makeHeatPayload()

export const Treemap = ({ theme, threshold }) => {
  const chart = useMemo(() => {
    const sdk = makeDefaultSDK({ attributes: { theme, designFlavour: "modern" } })
    const made = sdk.makeChart({
      getChart: makeMockPayload(payload, { delay: 0 }),
      attributes: {
        id: `treemap-${theme}`,
        chartLibrary: "groupBoxes",
        contextScope: ["modern.nodes.cpu"],
        groupBoxesThreshold: threshold,
      },
    })
    sdk.appendChild(made)
    return made
  }, [theme, threshold])

  useEffect(() => () => chart.destroy(), [chart])

  return (
    <ThemeProvider theme={theme === "dark" ? DarkTheme : DefaultTheme}>
      <Flex column background="mainBackground" padding={[6]} height="560px">
        <GroupBoxes chart={chart} height="100%" width="100%" />
      </Flex>
    </ThemeProvider>
  )
}
Treemap.args = { theme: "dark", threshold: 90 }
Treemap.argTypes = { theme: { control: "radio", options: ["dark", "light"] } }

export default { title: "Charts/Group boxes treemap", parameters: { layout: "fullscreen" } }
