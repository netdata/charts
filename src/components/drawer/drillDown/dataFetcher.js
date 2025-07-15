import { fetchChartWeights } from "@/sdk/makeChart/api"

export const fetchDrilldownData = async chart => {
  const groupBy = chart.getAttribute("drilldown.groupBy", ["node", "instance", "dimension"])
  const groupByLabel = chart.getAttribute("drilldown.groupByLabel", [])
  const drawerTab = chart.getAttribute("drawer.tab")
  const overlays = chart.getAttribute("overlays")

  chart.updateAttribute("drilldown.loading", true)
  chart.updateAttribute("drilldown.error", null)

  try {
    const attrs = { groupBy, groupByLabel }
    
    if (drawerTab === "selectedArea" && overlays?.highlight?.range) {
      const [highlightAfter, highlightBefore] = overlays.highlight.range
      attrs.highlightAfter = highlightAfter
      attrs.highlightBefore = highlightBefore
    }

    const weightsResponse = await fetchChartWeights(chart, { attrs })

    chart.updateAttribute("drilldown.data", weightsResponse)
    chart.updateAttribute("drilldown.loading", false)

    return weightsResponse
  } catch (error) {
    chart.updateAttribute("drilldown.error", error.message)
    chart.updateAttribute("drilldown.loading", false)
    throw error
  }
}
