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
  const drawerTab = useAttributeValue("drawer.tab")
  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  const overlays = useAttributeValue("overlays")

  const { hierarchicalData, groupedBy } = useMemo(() => {
    if (!rawData?.result) return { hierarchicalData: [], groupedBy: groupBy }

    const responseGroupBy = rawData.request?.aggregations?.metrics?.[0]?.group_by || groupBy
    const groupedBy = [...responseGroupBy].reverse()
    
    const flatData = transformWeightsData(rawData, responseGroupBy)
    const hierarchicalData = buildHierarchicalTree(flatData, groupedBy)
    return { hierarchicalData, groupedBy }
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
  }, [chart, drawerAction, drawerTab, groupBy, groupByLabel, after, before, overlays?.highlight?.range])

  return { hierarchicalData, loading, error, groupedBy }
}
