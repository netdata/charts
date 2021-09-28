import React, { memo } from "react"
import { useChart } from "@/components/provider"

export default Component => {
  const ChartWithDataTrack = props => {
    const chart = useChart()
    const { context } = chart.getMetadata()

    return <Component data-track={context} {...props} />
  }

  return memo(ChartWithDataTrack)
}
