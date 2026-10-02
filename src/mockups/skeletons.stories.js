import React from "react"
import { FontLink } from "./primitives"
import { SkeletonMockups } from "./skeletons"

export const Skeletons = ({ theme, only }) => (
  <div style={{ minWidth: 1100 }}>
    <FontLink />
    <SkeletonMockups theme={theme} only={only === "all" ? undefined : only} />
  </div>
)
Skeletons.args = { theme: "dark", only: "all" }
Skeletons.argTypes = {
  theme: { control: "radio", options: ["dark", "light"] },
  only: { control: "radio", options: ["all", "outline", "horizon", "dots"] },
}

export default {
  title: "Mockups/Skeletons",
  parameters: { layout: "fullscreen" },
}
