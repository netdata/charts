import fetchAgentData from "./fetchAgentData"

export * from "./helpers"

export const fetchChartData = (chart, options) => {
  const { agent } = chart.getAttributes()

  if (agent) return fetchAgentData(chart, options)

  return fetchAgentData(chart, options) // CHANGE WHEN READY ON CLOUD
}

export const fetchChartMetadata = () => {
  throw new Error("not implemented")
}
