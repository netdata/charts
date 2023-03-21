import React, { forwardRef, memo } from "react"
import { useChart } from "@/components/provider"

export default Component => {
  const ChartWithDataTrack = forwardRef((props, ref) => {
    const chart = useChart()

    return <Component data-track={chart.track("container")} {...props} ref={ref} />
  })

  return memo(ChartWithDataTrack)
}
