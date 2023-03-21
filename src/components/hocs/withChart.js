import React from "react"
import { withChartProvider } from "@/components/provider"
import withChartTrack from "./withChartTrack"
import withFullscreen from "./withFullscreen"
import withDifferedMount from "./withDifferedMount"
import withHeight from "./withHeight"
import withTile from "./withTile"

export default (Component, options = {}) => {
  let ComponentWithChart = withFullscreen(withHeight(withChartTrack(withDifferedMount(Component))))

  if (options.tile) ComponentWithChart = withTile(ComponentWithChart)

  ComponentWithChart = withChartProvider(ComponentWithChart)

  const HOCContainer = props => <ComponentWithChart {...props} />

  return HOCContainer
}
