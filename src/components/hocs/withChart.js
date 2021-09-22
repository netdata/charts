import React from "react"
import { withChartProvider } from "@/components/provider"
import withIntersection from "./withIntersection"
import withFullscreen from "./withFullscreen"
import withDifferedMount from "./withDifferedMount"
import withHeight from "./withHeight"

export default Component => {
  const ChartWithDifferedMount = withDifferedMount(Component)

  const ChartWithIntersection = withIntersection(ChartWithDifferedMount)

  const ChartWithHeight = withHeight(ChartWithIntersection)

  const ChartWithFullscreen = withFullscreen(ChartWithHeight)

  const ChartWithProvider = withChartProvider(ChartWithFullscreen)

  const HOCContainer = props => <ChartWithProvider {...props} />

  return HOCContainer
}
