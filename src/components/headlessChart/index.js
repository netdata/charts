import React, { useMemo } from "react"
import ChartProvider, { useImmediateListener } from "@/components/provider"
import makeDefaultSDK from "@/makeDefaultSDK"
import useHeadlessChart from "./useHeadlessChart"

const RenderPropProvider = ({ children }) => {
  const headlessChartData = useHeadlessChart()
  return children(headlessChartData)
}

const HeadlessChart = ({ children, sdk, ...chartAttributes }) => {
  const chart = useMemo(() => {
    const chartSDK = sdk || makeDefaultSDK()
    return chartSDK.makeChart({ attributes: chartAttributes })
  }, [sdk, chartAttributes])

  useMemo(() => {
    if (sdk) {
      sdk.appendChild(chart)
    }
  }, [sdk, chart])

  useImmediateListener(() => {
    const id = window.requestAnimationFrame(chart.activate)

    return () => {
      window.cancelAnimationFrame(id)
      chart.deactivate()
    }
  }, [chart])

  if (typeof children === "function") {
    return (
      <ChartProvider chart={chart}>
        <RenderPropProvider>{children}</RenderPropProvider>
      </ChartProvider>
    )
  }

  return <ChartProvider chart={chart}>{children}</ChartProvider>
}

export default HeadlessChart
export { default as useHeadlessChart } from "./useHeadlessChart"
