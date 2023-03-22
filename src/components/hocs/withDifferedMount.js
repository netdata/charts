import React, { forwardRef } from "react"
import { useChart, useImmediateListener } from "@/components/provider"

export default Component => {
  const DifferedMount = forwardRef(({ isVisible = true, ...rest }, ref) => {
    const chart = useChart()

    useImmediateListener(() => {
      if (!isVisible) return

      chart.activate()

      return chart.deactivate
    }, [isVisible, chart])

    return <Component ref={ref} {...rest} />
  })

  return DifferedMount
}
