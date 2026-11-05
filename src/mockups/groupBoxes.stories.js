import React from "react"
import { FontLink } from "./primitives"
import { GroupBoxesMockups } from "./groupBoxes"

export const GroupBoxes = args => (
  <div style={{ minWidth: 1100 }}>
    <FontLink />
    <GroupBoxesMockups {...args} />
  </div>
)
GroupBoxes.args = { theme: "dark", groupBy: "two", only: "all", sizing: "equal" }
GroupBoxes.argTypes = {
  theme: { control: "radio", options: ["dark", "light"] },
  groupBy: { control: "radio", options: ["one", "two", "three"] },
  only: { control: "radio", options: ["all", "popover", "tiles", "treemap", "strips"] },
  sizing: { control: "radio", options: ["equal", "value"] },
}

export default {
  title: "Mockups/Group boxes",
  parameters: { layout: "fullscreen" },
}
