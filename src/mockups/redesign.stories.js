import React from "react"
import { FontLink } from "./primitives"
import LiveEdgeDashboard from "./directionLiveEdge"
import ReadoutDashboard from "./directionReadout"
import SignalDashboard from "./directionSignal"

const withFonts = Dashboard => () => (
  <div style={{ minWidth: 1280 }}>
    <FontLink />
    <Dashboard />
  </div>
)

export const ALiveEdge = withFonts(LiveEdgeDashboard)
ALiveEdge.storyName = "A: Live edge"

export const BReadout = withFonts(ReadoutDashboard)
BReadout.storyName = "B: Readout"

export const CSignalField = withFonts(SignalDashboard)
CSignalField.storyName = "C: Signal field"

export default {
  title: "Mockups/Redesign",
  parameters: { layout: "fullscreen" },
}
