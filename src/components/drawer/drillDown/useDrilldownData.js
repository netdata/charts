import { useEffect, useMemo } from "react"
import { useChart, useAttributeValue } from "@/components/provider"
import { fetchDrilldownData } from "./dataFetcher"
import { transformWeightsData, buildHierarchicalTree } from "./dataTransformer"

export const useDrilldownData = () => {
  const chart = useChart()
  const rawData = useAttributeValue("drilldown.data")
  const loading = useAttributeValue("drilldown.loading", false)
  const error = useAttributeValue("drilldown.error")
  const groupBy = useAttributeValue("drilldown.groupBy", ["node", "instance", "dimension"])
  const groupByLabel = useAttributeValue("drilldown.groupByLabel", [])
  const drawerAction = useAttributeValue("drawer.action")

  const hierarchicalData = useMemo(() => {
    if (!rawData?.result) return []
    
    const flatData = transformWeightsData(rawData, groupBy)
    return buildHierarchicalTree(flatData, groupBy)
  }, [rawData, groupBy])

  useEffect(() => {
    if (drawerAction !== "drillDown") return
    if (!chart) return

    const fetchData = async () => {
      try {
        await fetchDrilldownData(chart)
      } catch (err) {
        console.error("Failed to fetch drilldown data:", err)
      }
    }

    fetchData()
  }, [chart, drawerAction, groupBy, groupByLabel])

  return { hierarchicalData, loading, error }
}