import fetchAgentData from "./fetchAgentData"
import fetchAgentWeights from "./fetchAgentWeights"
import fetchCloudData from "./fetchCloudData"
import fetchCloudWeights from "./fetchCloudWeights"

export * from "./helpers"

export const fetchChartData = (chart, options) => {
  const { agent } = chart.getAttributes()

  options = {
    ...options,
    ...((chart.getAttribute("bearer") || chart.getAttribute("xNetdataBearer")) && {
      headers: {
        ...(chart.getAttribute("bearer")
          ? { Authorization: `Bearer ${chart.getAttribute("bearer")}` }
          : {
              "X-Netdata-Auth": `Bearer ${chart.getAttribute("xNetdataBearer")}`,
            }),
      },
    }),
  }

  return agent ? fetchAgentData(chart, options) : fetchCloudData(chart, options)
}

export const fetchChartWeights = (chart, options) => {
  const { agent } = chart.getAttributes()
  options = {
    ...options,
    ...((chart.getAttribute("bearer") || chart.getAttribute("xNetdataBearer")) && {
      headers: {
        ...(chart.getAttribute("bearer")
          ? { Authorization: `Bearer ${chart.getAttribute("bearer")}` }
          : {
              "X-Netdata-Auth": `Bearer ${chart.getAttribute("xNetdataBearer")}`,
            }),
      },
    }),
  }

  return agent ? fetchAgentWeights(chart, options) : fetchCloudWeights(chart, options)
}
