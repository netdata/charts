import React from "react"
import { useChart, useImmediateListener } from "@/components/provider"

export default Component => {
  const DifferedMount = ({ isVisible = true, height = "100%", width = "100%", ref, ...rest }) => {
    const chart = useChart()

    useImmediateListener(() => {
      if (!isVisible) return
      if (!!rest.uiName && rest.uiName !== "default") return

      const id = window.requestAnimationFrame(chart.activate)

      return () => {
        window.cancelAnimationFrame(id)
        chart.deactivate()
      }
    }, [isVisible, chart, rest.uiName])

    return <Component ref={ref} height={height} width={width} {...rest} />
  }

  return DifferedMount
}
