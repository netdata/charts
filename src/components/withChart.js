import React from "react"
import withIntersection from "./withIntersection"
import withFullscreen from "./withFullscreen"
import { withChartProvider } from "./provider"

export default Component => {
  const ChartWithIntersection = withIntersection(Component)

  const ChartWithFullscreen = withFullscreen(ChartWithIntersection)

  const ChartWithProvider = withChartProvider(ChartWithFullscreen)

  const HOCContainer = props => <ChartWithProvider {...props} />

  return HOCContainer
}
