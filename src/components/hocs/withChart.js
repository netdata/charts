import React from "react"
import { withChartProvider } from "@/components/provider"
import withChartTrack from "./withChartTrack"
import withFullscreen from "./withFullscreen"
// import withExpander from "./withExpander"
import withDeferredMount from "./withDeferredMount"
import withTile from "./withTile"

export default (Component, options = {}) => {
  let ComponentWithChart = withChartTrack(withDeferredMount(Component))

  if (options.tile) ComponentWithChart = withTile(ComponentWithChart)

  ComponentWithChart = withChartProvider(withFullscreen(ComponentWithChart))

  const HOCContainer = props => <ComponentWithChart {...props} />

  return HOCContainer
}
