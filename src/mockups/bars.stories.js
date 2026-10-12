import React from "react"
import { FontLink } from "./primitives"
import { BarsMockups } from "./bars"

export const Bars = ({ theme }) => (
  <div style={{ minWidth: 1340 }}>
    <FontLink />
    <BarsMockups theme={theme} />
  </div>
)
Bars.args = { theme: "dark" }
Bars.argTypes = { theme: { control: "radio", options: ["dark", "light"] } }

export default {
  title: "Mockups/Bars",
  parameters: { layout: "fullscreen" },
}
