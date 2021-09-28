import React from "react"
import { withChartProvider } from "@/components/provider"
import withChartTrack from "./withChartTrack"
import withIntersection from "./withIntersection"
import withFullscreen from "./withFullscreen"
import withDifferedMount from "./withDifferedMount"
import withHeight from "./withHeight"

export default Component => {
  const ChartWithDifferedMount = withDifferedMount(Component)

  const ChartWithGA = withChartTrack(ChartWithDifferedMount)

  const ChartWithIntersection = withIntersection(ChartWithGA)

  const ChartWithHeight = withHeight(ChartWithIntersection)

  const ChartWithFullscreen = withFullscreen(ChartWithHeight)

  const ChartWithProvider = withChartProvider(ChartWithFullscreen)

  const HOCContainer = props => <ChartWithProvider {...props} />

  return HOCContainer
}
