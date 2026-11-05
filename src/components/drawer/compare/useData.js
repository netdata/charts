import { useEffect, useMemo } from "react"
import { useChart, useAttributeValue } from "@/components/provider"
import { fetchComparisonData } from "./dataFetcher"
import { calculateStats, calculateComparisons } from "./calculations"

export default () => {
  const chart = useChart()
  const rawPeriods = useAttributeValue("comparePeriods")
  const loading = useAttributeValue("compareLoading")
  const error = useAttributeValue("compareError")

  const drawerAction = useAttributeValue("drawer.action")
  const tab = useAttributeValue("drawer.tab")
  const overlays = useAttributeValue("overlays")
  const customPeriods = useAttributeValue("customPeriods", [])
  const mainLoaded = useAttributeValue("loaded")
  const mainLoading = useAttributeValue("loading")
  const mainError = useAttributeValue("error")

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
      if (!chart.getAttribute("loaded")) return
      if (chart.getAttribute("loading") || chart.getAttribute("error")) return

      try {
        await fetchComparisonData(chart)
      } catch (err) {
        if (err.name === "AbortError") return
        console.error("Failed to fetch comparison data:", err)
      }
    }

    if (mainLoaded && !mainLoading && !mainError) fetchData()

    const unsubscribe = chart.on("successFetch", fetchData)

    return unsubscribe
  }, [drawerAction, customPeriods, mainLoaded, mainLoading, mainError])

  return { periods, loading, error }
}
