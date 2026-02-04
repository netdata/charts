import { useEffect, useMemo, useRef } from "react"
import { useChart, useAttributeValue } from "@/components/provider"
import { fetchChartWeights } from "@/sdk/makeChart/api"
import { transformCorrelationData, groupByContext } from "./dataTransformer"

const useData = () => {
  const chart = useChart()
  const abortControllerRef = useRef(null)
  const tab = useAttributeValue("drawer.tab", "window")
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  const overlays = useAttributeValue("overlays")
  const loading = useAttributeValue("correlate.loading", false)
  const error = useAttributeValue("correlate.error")
  const data = useAttributeValue("correlate.data")
  const method = useAttributeValue("correlate.method", "volume")
  const aggregation = useAttributeValue("correlate.aggregation", "average")
  const dataType = useAttributeValue("correlate.dataType", "")
  const threshold = useAttributeValue("correlate.threshold", 0.01)

  const getTimeRange = () => {
    if (tab === "selectedArea" && overlays?.highlight?.range) {
      const [highlightAfter, highlightBefore] = overlays.highlight.range
      const baselineDuration = highlightBefore - highlightAfter
      const baselineAfter = highlightAfter - baselineDuration * 4
      const baselineBefore = highlightAfter

      return {
        highlightAfter,
        highlightBefore,
        baselineAfter,
        baselineBefore,
      }
    }

    const windowDuration = before - after
    const baselineAfter = after - windowDuration * 4
    const baselineBefore = after

    if (after < 0) {
      const { renderedAt, fetchStartedAt } = chart.getAttributes()
      const now = Math.ceil((renderedAt || fetchStartedAt || Date.now()) / 1000)
      return {
        highlightAfter: now + after,
        highlightBefore: now + before,
        baselineAfter: now + baselineAfter,
        baselineBefore: now + baselineBefore,
      }
    }

    return {
      highlightAfter: after,
      highlightBefore: before,
      baselineAfter,
      baselineBefore,
    }
  }

  const fetchWeights = async signal => {
    const timeRange = getTimeRange()
    const nodesScope = chart.getFilteredAvailableNodeIds()

    try {
      const response = await fetchChartWeights(chart, {
        attrs: {
          ...timeRange,
          method,
          aggregationMethod: aggregation,
          options: dataType ? [dataType] : [],
          groupBy: ["node", "instance", "dimension"],
          contextScope: [],
          nodesScope,
        },
        signal,
      })

      if (!signal.aborted) {
        chart.updateAttribute("correlate.data", response)
        chart.updateAttribute("correlate.loading", false)
      }
    } catch (err) {
      if (!signal.aborted) {
        chart.updateAttribute("correlate.error", err.message || "Failed to fetch correlations")
        chart.updateAttribute("correlate.loading", false)
      }
    }
  }

  const transformedData = useMemo(() => {
    if (!data) return []

    const scopeContexts = chart.getAttribute("contextScope", [])
    const correlationData = transformCorrelationData(data, threshold, scopeContexts)
    return groupByContext(correlationData)
  }, [data, threshold, chart])

  useEffect(() => {
    const shouldFetch = tab === "window" || (tab === "selectedArea" && overlays?.highlight?.range)
    if (!shouldFetch) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    chart.updateAttribute("correlate.loading", true)
    chart.updateAttribute("correlate.error", null)

    fetchWeights(signal)

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [
    tab,
    method,
    aggregation,
    dataType,
    after,
    before,
    ...(tab === "selectedArea" ? overlays?.highlight?.range || [null, null] : [null, null]),
  ])

  return { loading, error, data: transformedData }
}

export default useData
