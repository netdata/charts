import React from "react"
import { FontLink } from "./primitives"
import { AnomalyRibbonMockups } from "./anomalyRibbon"

export const AnomalyRibbon = ({ theme }) => (
  <div style={{ minWidth: 1340 }}>
    <FontLink />
    <AnomalyRibbonMockups theme={theme} />
  </div>
)
AnomalyRibbon.args = { theme: "dark" }
AnomalyRibbon.argTypes = { theme: { control: "radio", options: ["dark", "light"] } }

export default {
  title: "Mockups/Anomaly ribbon",
  parameters: { layout: "fullscreen" },
}
