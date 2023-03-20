import fetchAgentData from "./fetchAgentData"
import fetchAgentWeights from "./fetchAgentWeights"

export * from "./helpers"

export const fetchChartData = (chart, options) => {
  const { agent } = chart.getAttributes()

  return agent ? fetchAgentData(chart, options) : fetchAgentData(chart, options) // CHANGE WHEN READY ON CLOUD
}

export const fetchChartWeights = (chart, options) => {
  const { agent } = chart.getAttributes()

  return agent ? fetchAgentWeights(chart, options) : fetchAgentWeights(chart, options) // CHANGE WHEN READY ON CLOUD
}
