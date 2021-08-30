import React from "react"
import { withChartProvider } from "@/components/provider"
import withIntersection from "./withIntersection"
import withFullscreen from "./withFullscreen"
import withDifferedMount from "./withDifferedMount"

export default Component => {
  const ChartWithIntersection = withIntersection(Component)

  const ChartWithDifferedMount = withDifferedMount(ChartWithIntersection)

  const ChartWithFullscreen = withFullscreen(ChartWithDifferedMount)

  const ChartWithProvider = withChartProvider(ChartWithFullscreen)

  const HOCContainer = props => <ChartWithProvider {...props} />

  return HOCContainer
}
