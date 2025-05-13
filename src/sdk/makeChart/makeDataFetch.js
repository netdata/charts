import { errorCodesToMessage } from "./api"
import makeGetClosestRow from "./makeGetClosestRow"
import getInitialFilterAttributes from "./filters/getInitialAttributes"
import camelizePayload from "./camelizePayload"

const initialPayload = {
  labels: [],
  data: [],
  all: [],
  tree: {},
}

export default chart => {
  let abortController = null
  let payload = initialPayload
  let nextPayload = null

  chart.lastFetch = [null, null]

  chart.getPayload = () => payload

  makeGetClosestRow(chart)

  chart.cancelFetch = () => abortController && abortController.abort()

  const finishFetch = () => {
    if (!chart) return

    chart.startAutofetch()
    chart.trigger("finishFetch")
    chart.trigger("render")
  }

  const getDataLength = payload => {
    const { data } = payload || initialPayload
    return data?.length || 0
  }

  chart.doneFetch = nextRawPayload => {
    chart.backoffMs = 0

    setTimeout(() => {
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
        chartType: attributes.selectedChartType || attributes.chartType || chartType,
        title: attributes.title === null ? title : attributes.title,
      })

      chart.updateAttributes({
        loaded: true,
        loading: false,
        processing: false,
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
  } = {}) => {
    if (!chart) return

    const options = {
      params,
      signal,
      ...((chart.getAttribute("bearer") || chart.getAttribute("xNetdataBearer")) && {
        headers: {
          ...(chart.getAttribute("bearer")
            ? {
                Authorization: `Bearer ${chart.getAttribute("bearer")}`,
              }
            : {
                "X-Netdata-Auth": `Bearer ${chart.getAttribute("xNetdataBearer")}`,
              }),
        },
      }),
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

    chart.updateAttributes({
      processing,
      loading: true,
      fetchStartedAt: Date.now(),
    })

    chart.cancelFetch()
    chart.trigger("startFetch")

    if (!isNewerThanRetention())
      return Promise.resolve().then(() => chart.failFetch({ message: "Exceeds data retention" }))

    abortController = new AbortController()

    return chart.baseFetch({
      doneFetch: chart.doneFetch,
      failFetch: chart.failFetch,
      signal: abortController.signal,
    })
  }

  chart.consumePayload = () => {
    if (payload === nextPayload || nextPayload === null) return false

    const prevPayload = payload
    payload = nextPayload
    if (chart) chart.trigger("payloadChanged", nextPayload, prevPayload)

    return true
  }

  chart.on("fetch", chart.fetch)
}
