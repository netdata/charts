import { errorCodesToMessage } from "./api"
import { getLiveFetchBefore } from "./api/helpers"
import makeGetClosestRow from "./makeGetClosestRow"
import getInitialFilterAttributes from "./filters/getInitialAttributes"
import camelizePayload from "./camelizePayload"

const initialPayload = {
  labels: [],
  data: [],
  all: [],
  tree: {},
}

const getLiveAnchor = payload => {
  const lastRow = payload?.data?.[payload.data.length - 1]
  const lastTimestamp = lastRow?.[0]

  return typeof lastTimestamp === "number" && isFinite(lastTimestamp) ? lastTimestamp : null
}

export default chart => {
  let abortController = null
  let payload = initialPayload
  let nextPayload = null
  let currentFetchKey = null

  chart.lastFetch = [null, null]

  chart.getPayload = () => payload

  makeGetClosestRow(chart)

  const getFetchKey = () => {
    const {
      after,
      before,
      points,
      selectedContexts,
      context,
      nodesScope,
      contextScope,
      selectedInstances,
      selectedDimensions,
      selectedLabels,
      aggregationMethod,
      groupBy,
      groupByLabel,
      postGroupBy,
      postGroupByLabel,
      postAggregationMethod,
      showPostAggregations,
      agent,
      host,
      nulls2zero,
    } = chart.getAttributes()
    const selectedNodes = chart.getFilteredNodeIds()

    return JSON.stringify({
      after,
      before,
      points,
      selectedContexts,
      context,
      nodesScope,
      contextScope,
      selectedNodes,
      selectedInstances,
      selectedDimensions,
      selectedLabels,
      aggregationMethod,
      groupBy,
      groupByLabel,
      postGroupBy,
      postGroupByLabel,
      postAggregationMethod,
      showPostAggregations,
      agent,
      host,
      nulls2zero,
    })
  }

  chart.cancelFetch = () => abortController && abortController.abort()

  const finishFetch = () => {
    if (!chart) return

    currentFetchKey = null
    chart.startAutofetch()
    chart.trigger("finishFetch")
    chart.trigger("render")
  }

  const getDataLength = payload => {
    const { data } = payload || initialPayload
    return data?.length || 0
  }

  const getFrozenWindowEnd = () => {
    const { after, hovering } = chart.getAttributes()
    if (after > 0) return null

    const paused = chart.getRoot?.()?.getAttribute?.("paused")
    if (!hovering && !paused) return null

    const windowEnd = chart.getDateWindow?.()?.[1]
    return typeof windowEnd === "number" && isFinite(windowEnd) ? windowEnd : null
  }

  const isFrozenAtAnotherAnchor = requestAnchor => {
    if (
      !chart.getAttribute("loaded") ||
      typeof requestAnchor !== "number" ||
      !isFinite(requestAnchor)
    )
      return false

    const frozenWindowEnd = getFrozenWindowEnd()
    if (frozenWindowEnd === null) return false

    return Math.ceil(frozenWindowEnd / 1000) * 1000 !== requestAnchor
  }

  chart.doneFetch = (nextRawPayload, { liveAnchor, requestAnchor = liveAnchor } = {}) => {
    chart.backoffMs = 0

    setTimeout(() => {
      if (isFrozenAtAnotherAnchor(requestAnchor)) {
        chart.updateAttributes({
          loading: false,
          processing: false,
        })
        finishFetch()
        return
      }

      const { result, chartType, versions, title, ...restPayload } = camelizePayload(
        nextRawPayload,
        chart
      )

      const prevPayload = nextPayload
      nextPayload = result

      const dataLength = getDataLength(nextPayload)

      chart.consumePayload()
      chart.invalidateClosestRowCache()

      if (!chart.getAttribute("loaded")) chart.getRoot().trigger("chartLoaded", chart)

      const attributes = chart.getAttributes()

      chart.setAttributes({
        chartType: attributes.chartType || chartType,
        title: attributes.title === null ? title : attributes.title,
      })

      chart.updateAttributes({
        loaded: true,
        loading: false,
        processing: false,
        liveAnchor: liveAnchor ?? getLiveAnchor(nextPayload),
        updatedAt: Date.now(),
        outOfLimits: !dataLength,
        ...restPayload,
        versions,
        error: null,
      })

      chart.updateDimensions()

      if (!chart.getAttribute("initializedFilters"))
        chart.setAttributes(getInitialFilterAttributes(chart))

      chart.trigger("successFetch", nextPayload, prevPayload)

      updateVersions(versions)
      finishFetch()
    })
  }

  const updateVersions = hashes => {
    if (!hashes || typeof hashes !== "object" || !chart) return

    const container = chart.getParent()
    if (!container) return

    const {
      alerts_hard_hash: alertsHardHash,
      alerts_soft_hash: alertsSoftHash,
      contexts_hard_hash: contextsHardHash,
      contexts_soft_hash: contextsSoftHash,
      nodes_hard_hash: nodesHardHash,
    } = hashes

    container.updateAttribute("versions", {
      alertsHardHash,
      alertsSoftHash,
      contextsHardHash,
      contextsSoftHash,
      nodesHardHash,
    })
  }

  chart.failFetch = error => {
    if (!chart) return

    if (error?.name === "AbortError") {
      chart.updateAttribute("loading", false)
      return
    }

    chart.backoff()
    chart.trigger("failFetch", error)

    if (!chart.getAttribute("loaded")) chart.getRoot().trigger("chartLoaded", chart)

    chart.updateAttributes({
      loaded: true,
      loading: false,
      processing: false,
      updatedAt: Date.now(),
      error:
        errorCodesToMessage[error?.errorMessage] ||
        error?.errorMessage ||
        error?.message ||
        "Something went wrong",
    })

    finishFetch()
  }

  const isNewerThanRetention = () => {
    if (!chart) return false

    const { firstEntry, after, before } = chart.getAttributes()
    if (!firstEntry) return true

    const absoluteBefore = after >= 0 ? before : Date.now() / 1000

    return firstEntry <= absoluteBefore
  }

  chart.baseFetch = ({
    doneFetch = chart.doneFetch,
    failFetch = chart.failFetch,
    signal,
    params = {},
    attrs,
  } = {}) => {
    if (!chart) return

    const options = {
      ...(attrs && { attrs }),
      params,
      signal,
    }

    return chart
      .getChart(chart, options)
      .then(data => {
        if (data?.errorMsgKey) return failFetch?.(data)
        if (!(Array.isArray(data?.result) || Array.isArray(data?.result?.data)))
          return failFetch?.()

        return doneFetch?.(data)
      })
      .catch(failFetch)
  }

  chart.fetch = ({ processing = false } = {}) => {
    if (!chart) return

    const fetchKey = getFetchKey()

    if (abortController && !abortController.signal.aborted && currentFetchKey === fetchKey) {
      return Promise.resolve()
    }

    const fetchStartedAt = Date.now()

    chart.updateAttributes({
      processing,
      loading: true,
      fetchStartedAt,
    })
    const frozenWindowEnd = getFrozenWindowEnd()
    const liveRequestBefore =
      frozenWindowEnd === null ? undefined : Math.ceil(frozenWindowEnd / 1000)
    const { after, hovering, renderedAt, viewUpdateEvery } = chart.getAttributes()
    const fetchBefore = getLiveFetchBefore({
      after,
      hovering,
      renderedAt,
      fetchStartedAt,
      viewUpdateEvery,
      liveRequestBefore,
    })
    const liveAnchor =
      typeof fetchBefore === "number" && isFinite(fetchBefore) && fetchBefore > 0
        ? fetchBefore * 1000
        : null
    const requestAnchor =
      after > 0
        ? null
        : (typeof fetchBefore === "number" && isFinite(fetchBefore)
            ? fetchBefore
            : Math.ceil(fetchStartedAt / 1000)) * 1000

    chart.cancelFetch()
    chart.trigger("startFetch")

    if (!isNewerThanRetention())
      return Promise.resolve().then(() => chart.failFetch({ message: "Exceeds data retention" }))

    currentFetchKey = fetchKey
    abortController = new AbortController()

    return chart.baseFetch({
      doneFetch: data => chart.doneFetch(data, { liveAnchor, requestAnchor }),
      failFetch: chart.failFetch,
      signal: abortController.signal,
      attrs:
        typeof fetchBefore === "number" && isFinite(fetchBefore)
          ? { liveRequestBefore: fetchBefore }
          : undefined,
    })
  }

  chart.consumePayload = () => {
    if (payload === nextPayload || nextPayload === null) return false

    const prevPayload = payload
    payload = nextPayload
    if (chart) {
      chart.invalidateRender()
      chart.trigger("payloadChanged", nextPayload, prevPayload)
    }

    return true
  }

  chart.on("fetch", chart.fetch)
}
