import React from "react"
import { FontLink } from "./primitives"
import { Tiles } from "./tiles"

export const DashboardTiles = ({ theme }) => (
  <div style={{ minWidth: 1340 }}>
    <FontLink />
    <Tiles theme={theme} />
  </div>
)
DashboardTiles.args = { theme: "dark" }
DashboardTiles.argTypes = { theme: { control: "radio", options: ["dark", "light"] } }

export default {
  title: "Mockups/Tiles",
  parameters: { layout: "fullscreen" },
}
