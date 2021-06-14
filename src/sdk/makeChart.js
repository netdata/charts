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
  let timeoutId

  const getPayload = () => payload

  const cancelFetch = () => fetchPromise?.cancel()

  const getMetadata = () => {
    const { host, context } = node.getAttributes()
    return sdk.chartsMetadata.get(host, context)
  }

  const clearFetchTimeout = () => {
    if (timeoutId === null) node.trigger("timeout", false)
    clearTimeout(timeoutId)
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
    clearFetchTimeout()
  }

  const failFetch = error => {
    node.updateAttribute("loading", false)
    node.trigger("failFetch", error)
    clearFetchTimeout()
  }

  const fetch = () => {
    node.trigger("startFetch")
    node.updateAttribute("loading", true)
    const attributes = node.getAttributes()
    const { host, context } = attributes

    const { updateEvery = 5 } = getMetadata() || {}
    timeoutId = setTimeout(() => {
      node.trigger("timeout", true)
      timeoutId = null
    }, updateEvery * 1000)

    return sdk.chartsMetadata.fetch(host, context).then(() => {
      fetchPromise = getChart(attributes)
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
    focus,
    blur,
  }

  return { ...instance, ...makeDimensions(instance) }
}
