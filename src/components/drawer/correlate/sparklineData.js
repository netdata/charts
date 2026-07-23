import { getAlias } from "@/helpers/units"
import { getPointValue } from "@/sdk/makeChart/getPointValue"
import { normalizeDataQueryUnits } from "@/sdk/dataQuery/response"

const maxConcurrentRequests = 4
const maxCachedResponses = 100
const maxBatchDimensions = 50
const maxSparklinePoints = 120

const requestAttributeKeys = [
  "after",
  "agent",
  "aggregationMethod",
  "before",
  "context",
  "contextScope",
  "dimensionsScope",
  "eliminateZeroDimensions",
  "groupBy",
  "groupByLabel",
  "groupingMethod",
  "groupingTime",
  "host",
  "liveAnchor",
  "limit",
  "nodesScope",
  "nulls2zero",
  "points",
  "postAggregationMethod",
  "postGroupBy",
  "postGroupByLabel",
  "renderedAt",
  "selectedContexts",
  "selectedDimensions",
  "selectedInstances",
  "selectedLabels",
  "selectedNodes",
  "showPostAggregations",
  "sparklineRateVolume",
  "tier",
  "timeout",
  "timeGroupOptions",
  "unaligned",
]

const states = new WeakMap()
const batchesByDimensions = new WeakMap()
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key)
const uniqueSorted = values => [...new Set(values)].sort()

const makeAbortError = () => {
  const error = new Error("The sparkline request was aborted")
  error.name = "AbortError"
  return error
}

export const getSparklineRequestKey = attrs =>
  JSON.stringify(
    requestAttributeKeys.reduce((result, key) => {
      result[key] = attrs[key]
      return result
    }, {})
  )

const makeDimensionBatches = dimensions => {
  const groups = new Map()
  const batchesByRowId = new Map()

  dimensions.forEach(item => {
    const groupKey = JSON.stringify([item.context, item.nodeId])
    const group = groups.get(groupKey) || []
    group.push(item)
    groups.set(groupKey, group)
  })

  groups.forEach(group => {
    for (let index = 0; index < group.length; index += maxBatchDimensions) {
      const batch = group.slice(index, index + maxBatchDimensions)
      batch.forEach(item => batchesByRowId.set(item.rowId, batch))
    }
  })

  return batchesByRowId
}

export const getSparklineBatchDimensions = (target, dimensions) => {
  if (!Array.isArray(dimensions)) return [target]

  let batches = batchesByDimensions.get(dimensions)
  if (!batches) {
    batches = makeDimensionBatches(dimensions)
    batchesByDimensions.set(dimensions, batches)
  }

  return batches.get(target.rowId) || [target]
}

export const getSparklineBatchAttributes = (chart, dimensions, overrides = {}) => {
  const [first] = dimensions
  if (!first) return null

  const points = overrides.points ?? chart.getAttribute("points") ?? maxSparklinePoints

  return {
    after: overrides.after ?? chart.getAttribute("after"),
    agent: chart.getAttribute("agent"),
    aggregationMethod:
      overrides.aggregationMethod ?? chart.getAttribute("correlate.aggregation", "average"),
    before: overrides.before ?? chart.getAttribute("before"),
    context: null,
    contextScope: [first.context],
    eliminateZeroDimensions: false,
    groupBy: ["dimension"],
    groupByLabel: [],
    groupingMethod: chart.getAttribute("groupingMethod"),
    groupingTime: chart.getAttribute("groupingTime"),
    host: chart.getAttribute("host"),
    liveAnchor: overrides.liveAnchor ?? chart.getAttribute("liveAnchor"),
    nodesScope: [first.nodeId],
    points: Math.min(points || maxSparklinePoints, maxSparklinePoints),
    postGroupBy: [],
    postGroupByLabel: [],
    renderedAt: overrides.renderedAt ?? chart.getAttribute("renderedAt"),
    selectedContexts: [],
    selectedDimensions: uniqueSorted(dimensions.map(item => item.dimension)),
    selectedInstances: [],
    selectedLabels: [],
    selectedNodes: [],
    showPostAggregations: false,
  }
}

export const normalizeSparklinePayload = (rawPayload, { rateVolume = false, timeGroup } = {}) => {
  const result = rawPayload?.result
  if (!result || !Array.isArray(result.labels) || !Array.isArray(result.data))
    throw new Error("Invalid sparkline response")

  const normalizedUnits = normalizeDataQueryUnits(rawPayload, { rateVolume, timeGroup })
  if (!normalizedUnits.available) throw new Error("Unsupported sparkline units")
  const dimensionUnits = normalizedUnits.units
  const defaultUnit = dimensionUnits[0] || rawPayload.db?.units || ""
  const seriesByDimension = new Map()

  for (let column = 1; column < result.labels.length; column++) {
    const values = new Array(result.data.length)
    let min = Infinity
    let max = -Infinity

    for (let rowIndex = 0; rowIndex < result.data.length; rowIndex++) {
      const row = result.data[rowIndex]
      const value = Array.isArray(row)
        ? getPointValue(row[column], result.point, "value")
        : undefined
      const normalizedValue = Number.isFinite(value) ? value : null

      values[rowIndex] = normalizedValue
      if (normalizedValue === null) continue
      if (normalizedValue < min) min = normalizedValue
      if (normalizedValue > max) max = normalizedValue
    }

    seriesByDimension.set(result.labels[column], {
      values,
      min: min === Infinity ? null : min,
      max: max === -Infinity ? null : max,
      latest: values[values.length - 1] ?? null,
      unit: getAlias(dimensionUnits[column - 1] ?? defaultUnit),
    })
  }

  return seriesByDimension
}

const makeRequestChart = (ownerChart, attrs) => ({
  ...ownerChart,
  getAttributes: () => ({ ...ownerChart.getAttributes(), ...attrs }),
  getAttribute: (key, defaultValue) =>
    hasOwn(attrs, key) ? attrs[key] : ownerChart.getAttribute(key, defaultValue),
  getFilteredNodeIds: () => attrs.selectedNodes,
})

const touchEntry = (state, entry) => {
  if (state.entries.get(entry.key) !== entry) return
  state.entries.delete(entry.key)
  state.entries.set(entry.key, entry)
}

const pruneCache = state => {
  if (state.entries.size <= maxCachedResponses) return

  for (const [key, entry] of state.entries) {
    if (state.entries.size <= maxCachedResponses) break
    if (entry.status !== "fulfilled" || entry.consumers) continue
    state.entries.delete(key)
  }
}

const removeEntry = (state, entry) => {
  if (state.entries.get(entry.key) === entry) state.entries.delete(entry.key)
}

const drainQueue = state => {
  while (state.active < maxConcurrentRequests && state.queue.length) {
    const entry = state.queue.shift()
    if (entry.status !== "queued") continue

    if (!entry.consumers) {
      entry.status = "cancelled"
      removeEntry(state, entry)
      entry.reject(makeAbortError())
      continue
    }

    entry.status = "active"
    state.active++

    state.ownerChart
      .getChart(entry.requestChart, {
        ...entry.options,
        attrs: entry.attrs,
        signal: entry.controller.signal,
      })
      .then(payload =>
        normalizeSparklinePayload(payload, {
          rateVolume: entry.attrs.sparklineRateVolume,
          timeGroup: entry.attrs.groupingMethod,
        })
      )
      .then(value => {
        entry.status = "fulfilled"
        entry.resolve(value)
        touchEntry(state, entry)
      })
      .catch(error => {
        entry.status = "rejected"
        removeEntry(state, entry)
        entry.reject(error)
      })
      .finally(() => {
        state.active--
        pruneCache(state)
        drainQueue(state)
      })
  }
}

const releaseConsumer = (state, entry) => {
  entry.consumers--
  if (entry.consumers || entry.status === "fulfilled") return

  if (entry.status === "queued") {
    entry.status = "cancelled"
    removeEntry(state, entry)
    entry.reject(makeAbortError())
  } else if (entry.status === "active") {
    removeEntry(state, entry)
    entry.controller.abort()
  }
}

const consumeEntry = (state, entry, signal) => {
  entry.consumers++
  touchEntry(state, entry)

  return new Promise((resolve, reject) => {
    let settled = false

    const finish = callback => value => {
      if (settled) return
      settled = true
      signal?.removeEventListener("abort", onAbort)
      releaseConsumer(state, entry)
      callback(value)
    }
    const onResolve = finish(resolve)
    const onReject = finish(reject)
    const onAbort = () => onReject(makeAbortError())

    if (signal?.aborted) {
      onAbort()
      return
    }

    signal?.addEventListener("abort", onAbort, { once: true })
    entry.promise.then(onResolve, onReject)
  })
}

const makeEntry = (state, attrs, options, key) => {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  const entry = {
    key,
    attrs,
    options,
    requestChart: makeRequestChart(state.ownerChart, attrs),
    promise,
    resolve,
    reject,
    controller: new AbortController(),
    consumers: 0,
    status: "queued",
  }

  state.entries.set(key, entry)
  state.queue.push(entry)
  return entry
}

const makeState = ownerChart => {
  const state = {
    ownerChart,
    entries: new Map(),
    queue: [],
    active: 0,
    getData: null,
  }

  state.getData = (attrs, { signal, ...options } = {}) => {
    const key = getSparklineRequestKey(attrs)
    const entry = state.entries.get(key) || makeEntry(state, attrs, options, key)
    const result = consumeEntry(state, entry, signal)
    drainQueue(state)
    return result
  }

  return state
}

export const getSparklineDataFetcher = ownerChart => {
  let state = states.get(ownerChart)
  if (!state) {
    state = makeState(ownerChart)
    states.set(ownerChart, state)
  }
  return state.getData
}

export const sparklineRequestLimits = {
  batchDimensions: maxBatchDimensions,
  cache: maxCachedResponses,
  concurrency: maxConcurrentRequests,
  points: maxSparklinePoints,
}
