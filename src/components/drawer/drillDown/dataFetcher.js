import { fetchChartWeights } from "@/sdk/makeChart/api"

export const fetchDrilldownData = async chart => {
  const groupBy = chart.getAttribute("drilldown.groupBy", ["node", "instance", "dimension"])
  const groupByLabel = chart.getAttribute("drilldown.groupByLabel", [])
  
  chart.updateAttribute("drilldown.loading", true)
  chart.updateAttribute("drilldown.error", null)

  try {
    const weightsResponse = await fetchChartWeights(chart, {
      attrs: { groupBy, groupByLabel }
    })

    chart.updateAttribute("drilldown.data", weightsResponse)
    chart.updateAttribute("drilldown.loading", false)

    return weightsResponse
  } catch (error) {
    chart.updateAttribute("drilldown.error", error.message)
    chart.updateAttribute("drilldown.loading", false)
    throw error
  }
}