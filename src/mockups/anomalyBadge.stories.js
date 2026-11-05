import React from "react"
import { FontLink } from "./primitives"
import { AnomalyBadgeMockups } from "./anomalyBadge"

export const AnomalyBadge = ({ theme }) => (
  <div style={{ minWidth: 1340 }}>
    <FontLink />
    <AnomalyBadgeMockups theme={theme} />
  </div>
)
AnomalyBadge.args = { theme: "dark" }
AnomalyBadge.argTypes = { theme: { control: "radio", options: ["dark", "light"] } }

export default {
  title: "Mockups/Anomaly badge",
  parameters: { layout: "fullscreen" },
}
