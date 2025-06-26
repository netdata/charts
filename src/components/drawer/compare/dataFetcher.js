import { fetchChartData } from "@/sdk/makeChart/api"
import camelizePayload from "@/sdk/makeChart/camelizePayload"

export const getCurrentTimeRange = chart => {
  const { after, before } = chart.getAttributes()
  const now = Math.floor(Date.now() / 1000)

  return {
    after: after < 0 ? now + after : after,
    before: before <= 0 ? now : before,
  }
}

export const getChartAttributes = chart => {
  const attributes = chart.getAttributes()
  const {
    after,
    before,
    comparePeriods,
    compareLoading,
    compareError,
    compareData,
    ...chartAttributes
  } = attributes

  return chartAttributes
}

export const getComparisonPeriods = ({ after, before }, customPeriods = []) => {
  const basePeriod = {
    id: "selected",
    label: "Selected timeframe",
    after,
    before,
    isBase: true,
  }

  const comparisonPeriods = customPeriods.map(period => ({
    ...period,
    after: after - period.offsetSeconds,
    before: before - period.offsetSeconds,
  }))

  return [basePeriod, ...comparisonPeriods]
}

export const fetchComparisonData = async chart => {
  const timeRange = getCurrentTimeRange(chart)
  const customPeriods = chart.getAttribute("customPeriods", [])
  const periods = getComparisonPeriods(timeRange, customPeriods)

  chart.updateAttribute("compareLoading", true)
  chart.updateAttribute("compareError", null)

  try {
    const fetchPromises = periods.map(async period => {
      try {
        const rawPayload = await fetchChartData(chart, {
          attrs: {
            after: period.after,
            before: period.before,
          },
        })

        const camelizedPayload = camelizePayload(rawPayload, chart)
        const { result } = camelizedPayload
        const payload = result

        return {
          ...period,
          payload,
          error: null,
        }
      } catch (error) {
        return {
          ...period,
          payload: null,
          error: error.message,
        }
      }
    })

    const results = await Promise.all(fetchPromises)

    chart.updateAttribute("comparePeriods", results)
    chart.updateAttribute("compareLoading", false)

    return results
  } catch (error) {
    chart.updateAttribute("compareError", error.message)
    chart.updateAttribute("compareLoading", false)
    throw error
  }
}
