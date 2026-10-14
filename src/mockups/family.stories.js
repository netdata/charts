import React from "react"
import { FontLink } from "./primitives"
import { Family } from "./family"

export const WholeFamily = ({ theme }) => (
  <div style={{ minWidth: 1340 }}>
    <FontLink />
    <Family theme={theme} />
  </div>
)
WholeFamily.args = { theme: "light" }
WholeFamily.argTypes = { theme: { control: "radio", options: ["light", "dark"] } }

export default {
  title: "Mockups/Family",
  parameters: { layout: "fullscreen" },
}
