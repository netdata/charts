import React, { useMemo } from "react"
import ChartProvider, { useImmediateListener } from "@/components/provider"
import makeDefaultSDK from "@/makeDefaultSDK"
import useHeadlessChart from "./useHeadlessChart"

const RenderPropProvider = ({ children }) => {
  const headlessChartData = useHeadlessChart()
  return children(headlessChartData)
}

const HeadlessChart = ({
  children,
  sdk: defaultSDK,
  chart: defaultChart,
  getChart,
  makeTrack,
  ...chartAttributes
}) => {
  const chart = useMemo(() => {
    if (defaultChart) return defaultChart

    const chartSDK = defaultSDK || makeDefaultSDK({ chartLibrary: "table" })

    const newChart = chartSDK.makeChart({
      attributes: chartAttributes,
      ...(!!getChart && { getChart }),
      ...(!!makeTrack && { makeTrack }),
    })

    chartSDK.appendChild(newChart)

    return newChart
  }, [defaultSDK, chartAttributes])

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

export { default as useHeadlessChart } from "./useHeadlessChart"

export default HeadlessChart
