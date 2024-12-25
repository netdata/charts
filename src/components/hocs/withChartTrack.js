import React, { memo } from "react"
import { useChart } from "@/components/provider"

export default Component => {
  const ChartWithDataTrack = props => {
    const chart = useChart()

    return <Component data-track={chart.track("container")} {...props} />
  }

  return memo(ChartWithDataTrack)
}
