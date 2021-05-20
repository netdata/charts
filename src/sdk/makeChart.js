import { camelizeKeys } from "@/helpers/objectTransform"
import deepEqual from "@/helpers/deepEqual"
import makeNode from "./makeNode"
import initialChartAttributes from "./initialChartAttributes"
import initialPayload from "./initialPayload"
import convert from "./unitConversion"
import { fetchChartData } from "./api"

export default ({ sdk, parent, getChart = fetchChartData, attributes } = {}) => {
  const node = makeNode({ sdk, parent, attributes: { ...initialChartAttributes, ...attributes } })
  let ui = null
  let fetchPromise = null
  let payload = initialPayload

  const getPayload = () => payload

  const cancelFetch = () => fetchPromise?.cancel()

  const getMetadata = () => {
    const { host, context } = node.getAttributes()
    return sdk.chartsMetadata.get(host, context)
  }

  const doneFetch = nextPayload => {
    const { dimensionIds, dimensionNames, result, ...restPayload } = camelizeKeys(nextPayload, {
      omit: ["result"],
    })
    const { data } = result

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
    })

    node.trigger("successFetch", payload)
  }

  const fetch = () => {
    node.updateAttribute("loading", true)
    const attributes = node.getAttributes()
    const { host, context } = attributes

    sdk.chartsMetadata.fetch(host, context).then(() => {
      fetchPromise = getChart(attributes)
      return fetchPromise.then(doneFetch).catch(error => {
        node.updateAttribute("loading", false)
      })
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

    return Intl.NumberFormat(undefined, {
      useGrouping: true,
      minimumFractionDigits: unitsConversionFractionDigits,
      maximumFractionDigits: unitsConversionFractionDigits,
    }).format(converted)
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
  }

  return instance
}
