import { camelizeKeys } from "@/helpers/objectTransform"
import deepEqual from "@/helpers/deepEqual"
import makeNode from "./makeNode"
import initialPayload from "./initialPayload"
import convert from "./unitConversion"
import { fetchChartData } from "./api"
import makeDimensions from "./makeDimensions"

export default ({ sdk, parent, getChart = fetchChartData, attributes } = {}) => {
  const node = makeNode({ sdk, parent, attributes })
  let ui = null
  let fetchPromise = null
  let payload = initialPayload
  let fetchDelayTimeoutId = null
  let fetchTimeoutId = null

  const getPayload = () => payload

  const cancelFetch = () => fetchPromise?.cancel()

  const getMetadata = () => {
    const { host, context } = node.getAttributes()
    return sdk.chartsMetadata.get(host, context)
  }

  const clearFetchDelayTimeout = () => {
    if (fetchDelayTimeoutId === null) node.trigger("timeout", false)
    clearTimeout(fetchDelayTimeoutId)
  }

  const startAutofetch = () => {
    const { fetchStatedAt, loading, autofetch, active } = node.getAttributes()

    if (!autofetch || loading || !active) return

    const { updateEvery = 1 } = getMetadata()

    if (fetchStatedAt === 0) return fetch()

    const fetchingPeriod = Date.now() - fetchStatedAt
    const updateEveryMs = updateEvery * 1000
    const div = fetchingPeriod / updateEveryMs
    const updateEveryMultiples = Math.floor(div)

    if (updateEveryMultiples >= 1) return fetch()

    const remaining = updateEveryMs - Math.round((div - Math.floor(div)) * updateEveryMs)

    fetchTimeoutId = setTimeout(() => {
      startAutofetch()
    }, remaining)
  }

  const finishFetch = () => {
    clearFetchDelayTimeout()
    startAutofetch()
    node.trigger("finishFetch")
  }

  const doneFetch = nextPayload => {
    const { dimensionIds, result, ...restPayload } = camelizeKeys(nextPayload, {
      omit: ["result"],
    })
    const { data } = result

    const prevPayload = payload
    if (deepEqual(payload.dimensionIds, dimensionIds)) {
      payload = {
        ...initialPayload,
        ...payload,
        ...restPayload,
        result: { ...payload.result, data },
      }
    } else {
      payload = { ...initialPayload, ...camelizeKeys(nextPayload) }
    }

    node.updateAttributes({
      loaded: true,
      loading: false,
      updatedAt: Date.now(),
    })

    node.trigger("successFetch", payload, prevPayload)
    finishFetch()
  }

  const failFetch = error => {
    payload = initialPayload
    node.updateAttribute("loading", false)
    node.trigger("failFetch", error)
    finishFetch()
  }

  const fetch = () => {
    node.trigger("startFetch")
    node.updateAttributes({ loading: true, fetchStatedAt: Date.now() })
    node.updateAttribute()
    const attributes = node.getAttributes()
    const { host, context } = attributes

    const { updateEvery = 5 } = getMetadata() || {}
    clearTimeout(fetchDelayTimeoutId)
    fetchDelayTimeoutId = setTimeout(() => {
      node.trigger("timeout", true)
      fetchDelayTimeoutId = null
    }, updateEvery * 1000)

    return sdk.chartsMetadata.fetch(host, context).then(() => {
      fetchPromise = getChart(instance)
      return fetchPromise.then(doneFetch).catch(failFetch)
    })
  }

  const getUI = () => ui
  const setUI = newUi => {
    ui = newUi
  }

  const getConvertedValue = value => {
    const {
      unitsConversionMethod,
      unitsConversionDivider,
      unitsConversionFractionDigits,
    } = node.getAttributes()
    const converted = convert(instance, unitsConversionMethod, value, unitsConversionDivider)

    if (unitsConversionFractionDigits === -1) return converted

    return Intl.NumberFormat(undefined, {
      useGrouping: true,
      minimumFractionDigits: unitsConversionFractionDigits,
      maximumFractionDigits: unitsConversionFractionDigits,
    }).format(converted)
  }

  const focus = () => node.updateAttribute("focused", true)
  const blur = () => node.updateAttribute("focused", false)
  const activate = () => {
    node.updateAttribute("active", true)
    sdk.trigger("active", instance, true)
  }
  const deactivate = () => {
    node.updateAttribute("active", false)
    sdk.trigger("active", instance, false)
  }

  const stopAutofetch = () => {
    clearTimeout(fetchTimeoutId)
    fetchTimeoutId = null
  }

  node.onAttributeChange("autofetch", autofetch => {
    if (autofetch) {
      startAutofetch()
    } else {
      stopAutofetch()
    }
  })

  node.onAttributeChange("active", active => {
    if (!active) return stopAutofetch()
    if (node.getAttribute("autofetch")) return startAutofetch()
  })

  const getUnitSign = () => {
    const unit = node.getAttribute("unit")
    return unit === "percentage" ? "%" : unit.replace(/milliseconds/, "ms")
  }

  const instance = {
    ...node,
    type: "chart",
    getUI,
    setUI,
    getMetadata,
    getPayload,
    fetch,
    doneFetch,
    cancelFetch,
    getConvertedValue,
    startAutofetch,
    focus,
    blur,
    activate,
    deactivate,
    getUnitSign,
  }

  return { ...instance, ...makeDimensions(instance) }
}
