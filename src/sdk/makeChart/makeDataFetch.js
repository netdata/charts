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

  chart.getPayload = () => payload

  makeGetClosestRow(chart)

  chart.cancelFetch = () => abortController && abortController.abort()

  const finishFetch = () => {
    if (!chart) return

    chart.startAutofetch()
    chart.trigger("finishFetch")
  }

  const getDataLength = payload => {
    const { data } = payload || initialPayload
    return data?.length || 0
  }

  chart.doneFetch = nextRawPayload => {
    chart.backoffMs = 0
    const { result, chartType, versions, ...restPayload } = camelizePayload(nextRawPayload)

    const prevPayload = nextPayload
    nextPayload = result

    const dataLength = getDataLength(nextPayload)

    chart.consumePayload()
    chart.invalidateClosestRowCache()

    if (!chart.getAttribute("loaded")) chart.getParent().trigger("chartLoaded", chart)

    const wasLoaded = chart.getAttribute("loaded")

    const attributes = chart.getAttributes()

    chart.updateAttributes({
      loaded: true,
      loading: false,
      updatedAt: Date.now(),
      outOfLimits: !dataLength,
      chartType: attributes.selectedChartType || attributes.chartType || chartType,
      ...restPayload,
      versions,
      title: attributes.title || restPayload.title,
      error: null,
    })

    chart.updateDimensions()

    if (!chart.getAttribute("initializedFilters"))
      chart.setAttributes(getInitialFilterAttributes(chart))

    if (wasLoaded) chart.trigger("successFetch", nextPayload, prevPayload)

    updateVersions(versions)
    finishFetch()
  }

  const updateVersions = ({
    alerts_hard_hash: alertsHardHash,
    alerts_soft_hash: alertsSoftHash,
    contexts_hard_hash: contextsHardHash,
    contexts_soft_hash: contextsSoftHash,
    nodes_hard_hash: nodesHardHash,
  }) => {
    if (!chart) return

    const container = chart.getParent()
    if (!container) return

    container.updateAttribute("versions", {
      alertsHardHash,
      alertsSoftHash,
      contextsHardHash,
      contextsSoftHash,
      nodesHardHash,
    })
  }

  const failFetch = error => {
    if (!chart) return

    if (error?.name === "AbortError") {
      chart.updateAttribute("loading", false)
      return
    }

    chart.backoff()
    chart.trigger("failFetch", error)

    if (!chart.getAttribute("loaded")) chart.getParent().trigger("chartLoaded", chart)

    chart.updateAttributes({
      loaded: true,
      loading: false,
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
    const absoluteBefore = after >= 0 ? before : Date.now() / 1000
    return !firstEntry || firstEntry <= absoluteBefore
  }

  chart.fetch = () => {
    if (!chart) return

    chart.cancelFetch()
    chart.trigger("startFetch")
    chart.updateAttributes({ loading: true, fetchStartedAt: Date.now() })

    if (!isNewerThanRetention())
      return Promise.resolve().then(() =>
        failFetch({ message: "Exceeds agent data retention settings" })
      )

    abortController = new AbortController()
    const options = { signal: abortController.signal }

    return chart
      .getChart(chart, options)
      .then(data => {
        if (data?.errorMsgKey) return failFetch(data)
        if (!(Array.isArray(data?.result) || Array.isArray(data?.result?.data))) return failFetch()

        return chart.doneFetch(data)
      })
      .catch(failFetch)
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
