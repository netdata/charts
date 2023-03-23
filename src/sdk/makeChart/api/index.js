import fetchAgentData from "./fetchAgentData"
import fetchAgentWeights from "./fetchAgentWeights"
import fetchCloudData from "./fetchCloudData"
import fetchCloudWeights from "./fetchCloudWeights"

export * from "./helpers"

export const fetchChartData = (chart, options) => {
  const { agent } = chart.getAttributes()

  return agent ? fetchAgentData(chart, options) : fetchCloudData(chart, options)
}

export const fetchChartWeights = (chart, options) => {
  const { agent } = chart.getAttributes()

  return agent ? fetchAgentWeights(chart, options) : fetchCloudWeights(chart, options)
}
