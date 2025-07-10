import { useEffect, useMemo } from "react"
import { useChart, useAttributeValue } from "@/components/provider"
import { fetchComparisonData } from "./dataFetcher"
import { calculateStats, calculateComparisons } from "./calculations"

export const useComparisonData = () => {
  const chart = useChart()
  const rawPeriods = useAttributeValue("comparePeriods")
  const loading = useAttributeValue("compareLoading")
  const error = useAttributeValue("compareError")

  const after = useAttributeValue("after")
  const before = useAttributeValue("before")
  const drawerAction = useAttributeValue("drawer.action")
  const tab = useAttributeValue("drawer.tab")
  const overlays = useAttributeValue("overlays")

  const periods = useMemo(() => {
    if (!rawPeriods?.length) return []

    const baseHighlightRange = tab === "selectedArea" ? overlays?.highlight?.range : null

    const periodsWithStats = rawPeriods.map(period => {
      let highlightRange = baseHighlightRange

      if (baseHighlightRange && !period.isBase) {
        const basePeriod = rawPeriods.find(p => p.isBase)
        if (basePeriod) {
          const timeOffset = basePeriod.after - period.after
          highlightRange = [baseHighlightRange[0] - timeOffset, baseHighlightRange[1] - timeOffset]
        }
      }

      return {
        ...period,
        stats: period.payload ? calculateStats(period.payload, highlightRange) : null,
      }
    })

    return calculateComparisons(periodsWithStats)
  }, [rawPeriods, tab, overlays?.highlight?.range])

  useEffect(() => {
    if (drawerAction !== "compare") return
    if (!chart) return

    const fetchData = async () => {
      try {
        await fetchComparisonData(chart)
      } catch (err) {
        console.error("Failed to fetch comparison data:", err)
      }
    }

    fetchData()
  }, [chart, after, before, drawerAction])

  return { periods, loading, error }
}
