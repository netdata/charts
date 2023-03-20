import fetchAgentData from "./fetchAgentData"

export * from "./helpers"

export const fetchChartData = (chart, options) => {
  const { agent } = chart.getAttributes()

  return agent ? fetchAgentData(chart, options) : fetchAgentData(chart, options) // CHANGE WHEN READY ON CLOUD
}
