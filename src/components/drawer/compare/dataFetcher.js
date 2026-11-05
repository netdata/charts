import { getPointValue } from "@/sdk/makeChart/getPointValue"

const comparisonRequests = new WeakMap()
const syntheticLabels = ["ANOMALY_RATE", "ANNOTATIONS"]

export const getCurrentTimeRange = chart => {
  const [after, before] = chart.getDateWindow()

  return {
    after: Math.floor(after / 1000),
    before: Math.floor(before / 1000),
  }
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

const getComparisonValue = (cell, point) => {
  const value = getPointValue(cell, point)

  if (typeof value === "undefined") throw new Error("Invalid comparison data point")
  if (value !== null && typeof value !== "number") throw new Error("Invalid comparison data value")

  return value
}

export const normalizeComparisonPayload = rawPayload => {
  const result = rawPayload?.result
  const view = rawPayload?.view

  if (!result || !Array.isArray(result.labels) || !Array.isArray(result.data))
    throw new Error("Invalid comparison response")

  const labels = result.labels
  const missingSyntheticLabels = syntheticLabels.filter(label => !labels.includes(label))
  const data = result.data.map(row => {
    if (!Array.isArray(row) || row.length !== labels.length || typeof row[0] !== "number")
      throw new Error("Invalid comparison data row")

    const normalizedRow = new Array(labels.length + missingSyntheticLabels.length)
    normalizedRow[0] = row[0]

    for (let index = 1; index < labels.length; index++)
      normalizedRow[index] = getComparisonValue(row[index], result.point)

    normalizedRow.fill(null, labels.length)
    return normalizedRow
  })

  return {
    labels: [...labels, ...missingSyntheticLabels],
    data,
    viewUpdateEvery: view?.update_every,
  }
}

export const getMainPeriodPayload = chart => {
  if (!chart.getAttribute("loaded")) return null

  return {
    ...chart.getPayload(),
    viewUpdateEvery: chart.getAttribute("viewUpdateEvery", 1),
  }
}

const isSameBatch = (request, sourcePayload, viewUpdateEvery, periodsKey) =>
  request?.sourcePayload === sourcePayload &&
  request.viewUpdateEvery === viewUpdateEvery &&
  request.periodsKey === periodsKey

const fetchPeriod = async (chart, period, controller) => {
  try {
    const rawPayload = await chart.getChart(chart, {
      attrs: {
        after: period.after,
        before: period.before,
      },
      signal: controller.signal,
    })

    return {
      ...period,
      payload: normalizeComparisonPayload(rawPayload),
      error: null,
    }
  } catch (error) {
    if (error.name === "AbortError") throw error

    return {
      ...period,
      payload: null,
      error: error.message || "Failed to load comparison period",
    }
  }
}

export const fetchComparisonData = chart => {
  const mainPayload = getMainPeriodPayload(chart)
  if (!mainPayload) return Promise.resolve([])

  const sourcePayload = chart.getPayload()
  const viewUpdateEvery = chart.getAttribute("viewUpdateEvery", 1)
  const periods = getComparisonPeriods(
    getCurrentTimeRange(chart),
    chart.getAttribute("customPeriods", [])
  )
  const periodsKey = JSON.stringify(periods)
  const activeRequest = comparisonRequests.get(chart)

  if (isSameBatch(activeRequest, sourcePayload, viewUpdateEvery, periodsKey))
    return activeRequest.promise
  activeRequest?.controller.abort()

  const controller = new AbortController()
  const request = {
    controller,
    sourcePayload,
    viewUpdateEvery,
    periodsKey,
    promise: null,
  }

  chart.updateAttribute("compareLoading", true)
  chart.updateAttribute("compareError", null)

  request.promise = Promise.all(
    periods.slice(1).map(period => fetchPeriod(chart, period, controller))
  )
    .then(historicalPeriods => {
      const results = [
        {
          ...periods[0],
          payload: mainPayload,
          error: null,
        },
        ...historicalPeriods,
      ]

      if (comparisonRequests.get(chart) === request) {
        chart.updateAttribute("comparePeriods", results)
        chart.updateAttribute("compareLoading", false)
      }

      return results
    })
    .catch(error => {
      if (error.name === "AbortError" || comparisonRequests.get(chart) !== request) return []

      chart.updateAttribute("compareError", error.message)
      chart.updateAttribute("compareLoading", false)
      throw error
    })
    .finally(() => {
      if (comparisonRequests.get(chart) === request) comparisonRequests.delete(chart)
    })

  comparisonRequests.set(chart, request)
  return request.promise
}
