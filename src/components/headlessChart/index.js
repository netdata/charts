import React, { useLayoutEffect, useMemo, useRef } from "react"
import ChartProvider from "@/components/provider"
import makeDefaultSDK from "@/makeDefaultSDK"
import deepEqual from "@/helpers/deepEqual"
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
  const instance = useMemo(() => {
    if (defaultChart) return { chart: defaultChart, owned: false }

    const chartSDK = defaultSDK || makeDefaultSDK({ chartLibrary: "table" })

    const newChart = chartSDK.makeChart({
      attributes: chartAttributes,
      ...(!!getChart && { getChart }),
      ...(!!makeTrack && { makeTrack }),
    })

    chartSDK.appendChild(newChart)

    return { chart: newChart, owned: true }
  }, [defaultChart, defaultSDK, getChart, makeTrack])
  const { chart, owned } = instance
  const previousAttributesRef = useRef(null)

  useLayoutEffect(() => {
    if (!owned) return

    const previous = previousAttributesRef.current
    previousAttributesRef.current = { chart, attributes: chartAttributes }
    if (!previous || previous.chart !== chart || deepEqual(previous.attributes, chartAttributes))
      return

    const removedAttributes = Object.keys(previous.attributes).reduce((result, key) => {
      if (!(key in chartAttributes)) result[key] = undefined
      return result
    }, {})

    chart.updateAttributes({ ...removedAttributes, ...chartAttributes })
    if (chart.getAttribute("active")) chart.trigger("fetch")
  }, [chart, owned, chartAttributes])

  useLayoutEffect(() => {
    const id = window.requestAnimationFrame(chart.activate)

    return () => {
      window.cancelAnimationFrame(id)
      chart.cancelFetch?.()
      chart.deactivate()
      if (owned) chart.destroy()
    }
  }, [chart, owned])

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
export { default as useGroupedChart } from "./useGroupedChart"
export { default as BreakdownChart } from "./breakdownChart"

export default HeadlessChart
