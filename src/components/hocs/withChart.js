import React from "react"
import { withChartProvider } from "@/components/provider"
import withChartTrack from "./withChartTrack"
import withFullscreen from "./withFullscreen"
import withDeferredMount from "./withDeferredMount"
import withResize from "./withResize"
import withTile from "./withTile"

export default (Component, options = {}) => {
  let ComponentWithChart = withFullscreen(withChartTrack(withDeferredMount(Component)))

  if (options.tile) ComponentWithChart = withTile(ComponentWithChart)

  ComponentWithChart = withChartProvider(ComponentWithChart)

  const HOCContainer = props => <ComponentWithChart {...props} />

  return HOCContainer
}
