import fetchCompositeChartData from "./fetchCompositeChartData"
import fetchSingleChartData from "./fetchSingleChartData"
import fetchAgentData from "./fetchAgentData"

export * from "./helpers"

export const fetchChartData = (chart, options) => {
  const { composite, agent } = chart.getAttributes()

  if (agent) return fetchAgentData(chart, options)

  if (composite) return fetchCompositeChartData(chart, options)

  return fetchSingleChartData(chart, options)
}

export const fetchChartMetadata = () => {
  throw new Error("not implemented")
}
