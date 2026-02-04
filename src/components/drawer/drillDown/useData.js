import { useEffect, useMemo } from "react"
import { useChart, useAttributeValue } from "@/components/provider"
import { fetchChartWeights } from "@/sdk/makeChart/api"
import { transformWeightsData, buildHierarchicalTree } from "./dataTransformer"

const fetch = async (chart, signal) => {
  const groupBy = chart.getAttribute("drilldown.groupBy", ["node", "instance", "dimension"])
  const groupByLabel = chart.getAttribute("drilldown.groupByLabel", [])
  const drawerTab = chart.getAttribute("drawer.tab")
  const overlays = chart.getAttribute("overlays")

  chart.updateAttribute("drilldown.loading", true)
  chart.updateAttribute("drilldown.error", null)

  const nodesScope = chart.getFilteredAvailableNodeIds()
  const attrs = { groupBy, groupByLabel, method: "value", nodesScope }

  if (drawerTab === "selectedArea" && overlays?.highlight?.range) {
    const [highlightAfter, highlightBefore] = overlays.highlight.range
    attrs.highlightAfter = highlightAfter
    attrs.highlightBefore = highlightBefore
    attrs.baselineAfter = highlightAfter
    attrs.baselineBefore = highlightBefore
  }

  const weightsResponse = await fetchChartWeights(chart, { attrs, signal })

  chart.updateAttribute("drilldown.data", weightsResponse)
  chart.updateAttribute("drilldown.loading", false)

  return weightsResponse
}

export default () => {
  const chart = useChart()
  const rawData = useAttributeValue("drilldown.data")
  const loading = useAttributeValue("drilldown.loading", false)
  const error = useAttributeValue("drilldown.error")
  const groupBy = useAttributeValue("drilldown.groupBy", ["node", "instance", "dimension"])
  const groupByLabel = useAttributeValue("drilldown.groupByLabel", [])
  const drawerAction = useAttributeValue("drawer.action")
  const drawerTab = useAttributeValue("drawer.tab")
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  const overlays = useAttributeValue("overlays")

  const { hierarchicalData, groupedBy } = useMemo(() => {
    if (!rawData?.result) return { hierarchicalData: [], groupedBy: groupBy }

    const responseGroupBy = rawData.request?.aggregations?.metrics?.[0]?.group_by || groupBy
    const groupedBy = [...responseGroupBy].reverse()

    const flatData = transformWeightsData(rawData, responseGroupBy, chart)
    const hierarchicalData = buildHierarchicalTree(flatData, groupedBy)
    return { hierarchicalData, groupedBy }
  }, [rawData, groupBy, chart])

  useEffect(() => {
    if (drawerAction !== "drillDown") return
    if (!chart) return

    const abortController = new AbortController()

    const fetchData = async () => {
      try {
        await fetch(chart, abortController.signal)
      } catch (err) {
        if (err.name === "AbortError") return
        chart.updateAttribute(
          "drilldown.error",
          err.errorMessage || "Failed to fetch drilldown data"
        )
        chart.updateAttribute("drilldown.loading", false)
      }
    }

    fetchData()

    return () => {
      abortController.abort()
    }
  }, [drawerAction, drawerTab, groupBy, groupByLabel, after, before, overlays?.highlight?.range])

  return { hierarchicalData, loading, error, groupedBy }
}
