import deepEqual from "@/helpers/deepEqual"
import makeKeyboardListener from "@/helpers/makeKeyboardListener"
import makeNode from "./makeNode"
import initialPayload from "./initialPayload"
import convert from "./unitConversion"
import { fetchChartData } from "./api"
import makeDimensions from "./makeDimensions"
import makeGetClosestRow from "./makeGetClosestRow"
import getInitialFilterAttributes from "./filters/getInitialAttributes"
import makeFilterControllers from "./filters/makeControllers"
import makeGetUnitSign from "./makeGetUnitSign"
import camelizePayload from "./camelizePayload"
import initialMetadata from "./initialMetadata"

const maxBackoffMs = 30 * 1000

const defaultMakeTrack = () => value => value

export default ({
  sdk,
  parent,
  getChart = fetchChartData,
  chartsMetadata,
  attributes,
  makeTrack = defaultMakeTrack,
} = {}) => {
  let node = makeNode({ sdk, parent, attributes })
  let ui = null
  let abortController = null
  let payload = initialPayload
  let nextPayload = null
  let fetchTimeoutId = null
  let prevMetadata = null

  let backoffMs = null
  const backoff = ms => {
    if (ms) {
      backoffMs = ms
      return
    }
    const tmpBackoffMs = backoffMs ? backoffMs * 2 : getUpdateEvery()
    backoffMs = tmpBackoffMs > maxBackoffMs ? maxBackoffMs : tmpBackoffMs
  }

  const getMetadataDecorator = () =>
    node ? chartsMetadata || sdk.chartsMetadata : sdk.chartsMetadata

  const getPayload = () => payload

  const { invalidateClosestRowCache, getClosestRow } = makeGetClosestRow(getPayload)

  const cancelFetch = () => abortController && abortController.abort()

  const getMetadata = () =>
    node ? getMetadataDecorator().get(instance) || initialMetadata : initialMetadata
  const setMetadataAttributes = (values = {}) => {
    if (!node || !getMetadataDecorator().set) return getMetadata()
    getMetadataDecorator().set(instance, values)
    updateMetadata()
    return getMetadata()
  }
  const setMetadataAttribute = (attribute, value) => setMetadataAttributes({ [attribute]: value })
  const fetchMetadata = () =>
    node ? getMetadataDecorator().fetch(instance) : Promise.resolve(initialMetadata)

  const getUpdateEvery = () => {
    if (!node) return

    const { loaded, updateEvery: updateEveryAttribute } = node.getAttributes()
    if (updateEveryAttribute) return updateEveryAttribute * 1000

    const { viewUpdateEvery } = getPayload()
    if (loaded && viewUpdateEvery) return viewUpdateEvery * 1000

    const { updateEvery } = getMetadata()
    return updateEvery * 1000 || 2000
  }

  const startAutofetch = () => {
    if (!node) return

    const { fetchStartedAt, loading, autofetch, active, paused } = node.getAttributes()

    if (!autofetch || loading || !active || paused) return

    if (fetchStartedAt === 0) return fetch()

    const fetchingPeriod = Date.now() - fetchStartedAt
    const updateEveryMs = getUpdateEvery()
    const div = fetchingPeriod / updateEveryMs
    const updateEveryMultiples = Math.floor(div)

    if (updateEveryMultiples >= 1) return fetch()

    const remaining =
      backoffMs || updateEveryMs - Math.round((div - Math.floor(div)) * updateEveryMs)

    clearTimeout(fetchTimeoutId)
    fetchTimeoutId = setTimeout(() => {
      startAutofetch()
    }, remaining)
  }

  const finishFetch = () => {
    if (!node) return

    startAutofetch()
    node.trigger("finishFetch")
  }

  const transformResult = ({ viewUpdateEvery, after, result }) => {
    if (!Array.isArray(result)) return result

    const data = result.map((point, index) => [
      (after + viewUpdateEvery * (index + 1)) * 1000,
      point,
    ])

    return { labels: ["time", "sum"], data }
  }

  const getDataLength = ({ result } = {}) =>
    Array.isArray(result) ? result.length : result.data?.length || 0

  const doneFetch = (nextRawPayload, { errored = false } = {}) => {
    if (!errored) backoffMs = 0
    const nextPayloadTransformed = camelizePayload(nextRawPayload)

    const result = transformResult(nextPayloadTransformed)

    const { dimensionIds, metadata, ...restPayload } = nextPayloadTransformed

    const prevPayload = nextPayload
    if (deepEqual(payload.dimensionIds, dimensionIds)) {
      nextPayload = {
        ...initialPayload,
        ...nextPayload,
        ...restPayload,
        dimensionIds,
        result,
      }
    } else {
      nextPayload = { ...initialPayload, ...restPayload, dimensionIds, result }
    }

    setMetadataAttributes(metadata)

    const dataLength = getDataLength(nextPayload)
    if (
      !node.getAttribute("loaded") ||
      (dataLength > 0 && getDataLength(payload) === 0) ||
      (getDataLength(payload) > 0 && dataLength === 0)
    )
      consumePayload()

    invalidateClosestRowCache()

    if (!node.getAttribute("loaded") && !errored) node.getParent().trigger("chartLoaded", node)

    node.updateAttributes({
      loaded: true,
      loading: false,
      updatedAt: Date.now(),
      outOfLimits: !dataLength,
    })

    if (!errored) node.trigger("successFetch", nextPayload, prevPayload)
    finishFetch()
  }

  const failFetch = error => {
    if (!node) return

    node.updateAttributes({
      loading: false,
    })
    if (error?.name === "AbortError") return

    backoff()
    if (!error || error.name !== "AbortError") node.trigger("failFetch", error)

    doneFetch(initialPayload, { errored: true })
  }

  const dataFetch = () => {
    abortController = new AbortController()
    const options = { signal: abortController.signal }
    return getChart(instance, options).then(doneFetch).catch(failFetch)
  }

  const isNewerThanRetention = () => {
    const metadata = getMetadata()

    if (metadata) {
      if (!node) return

      const { firstEntry } = metadata
      const { after, before } = node.getAttributes()
      const absoluteBefore = after >= 0 ? before : Date.now() / 1000
      return !firstEntry || firstEntry <= absoluteBefore
    }

    return false
  }

  const fetch = () => {
    if (!node) return

    node.trigger("startFetch")
    node.updateAttributes({ loading: true, fetchStartedAt: Date.now() })

    updateMetadata()
    if (!isNewerThanRetention())
      return Promise.resolve().then(() => doneFetch(initialPayload, { errored: true }))

    const doFetchMetadata = () => {
      if (!node) return

      return fetchMetadata()
        .catch(error => {
          // Do not throw (but rather resolve the promise) if the error is due to filters changing.
          // It is not a chart data error, but rather metadata issue.
          if (error.message === "not_found" && error.cause === "filters") return

          throw error
        })
        .then(() => {
          updateMetadata()
          if (!isNewerThanRetention())
            return Promise.resolve().then(() => doneFetch(initialPayload, { errored: true }))
        })
        .catch(failFetch)
    }

    const fetchData = () => {
      if (!node) return

      return dataFetch().then(() => {
        const { fullyLoaded } = getMetadata()
        if (fullyLoaded) return

        return doFetchMetadata()
      })
    }

    if (node.getAttribute("shouldFetchMetadata")) return doFetchMetadata().then(fetchData)

    return fetchData()
  }

  const updateMetadata = () => {
    if (!node) return

    const metadata = getMetadata()
    if (metadata === prevMetadata) return

    prevMetadata = getMetadata()
    dimensions.updateMetadataColors()
    node.trigger("metadataChanged")

    if (node.getAttribute("composite") && !node.getAttribute("initializedFilters")) {
      const attributes = getInitialFilterAttributes(instance)
      node.setAttributes(attributes)
    }
  }

  const getUI = () => ui
  const setUI = newUi => {
    ui = newUi
  }

  const fetchAndRender = ({ initialize = false } = {}) => {
    if (!!node && initialize) node.updateAttribute("loaded", false)
    return fetch().then(() => ui && ui.render())
  }

  const getConvertedValue = value => {
    if (!node) return

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

  const focus = event => {
    if (!node) return
    node.updateAttributes({ focused: true, hovering: true })
    sdk.trigger("hoverChart", node, event)
    node.trigger("hoverChart", event)
  }

  const blur = event => {
    if (!node) return
    node.updateAttributes({ focused: false, hovering: false })
    sdk.trigger("blurChart", node, event)
    node.trigger("blurChart", event)
  }

  const activate = () => {
    if (!node) return
    node.updateAttribute("active", true)
    sdk.trigger("active", instance, true)
  }

  const deactivate = () => {
    if (!node) return
    node.updateAttribute("active", false)
    sdk.trigger("active", instance, false)
  }

  const stopAutofetch = () => {
    clearTimeout(fetchTimeoutId)

    if (!node) return

    if (
      !node.getAttribute("active") &&
      node.getAttribute("loaded") &&
      node.getAttribute("loading")
    ) {
      cancelFetch()
    }
  }

  const getFirstEntry = () => {
    const { firstEntry: firstEntryMetadata } = getMetadata()
    const { firstEntry: firstEntryPayload } = getPayload()
    return firstEntryMetadata || firstEntryPayload
  }

  const getUnits = () => {
    if (!node) return

    const { units: metadataUnits } = getMetadata()
    const { units: attributeUnits, unitsConversion } = node.getAttributes()
    return unitsConversion || attributeUnits || metadataUnits
  }

  node.onAttributeChange("autofetch", autofetch => {
    if (autofetch) {
      startAutofetch()
    } else {
      stopAutofetch()
    }
  })

  node.onAttributeChange("active", active => {
    if (!node) return

    if (!active) return stopAutofetch()
    if (node.getAttribute("autofetch")) return startAutofetch()
  })

  const { onKeyChange, initKeyboardListener, clearKeyboardListener } = makeKeyboardListener()

  node.onAttributeChange("focused", focused => {
    if (!node) return

    focused ? initKeyboardListener() : clearKeyboardListener()
    invalidateClosestRowCache()
  })

  const getApplicableNodes = (attributes, options) => {
    if (!node) return []

    if (!node.match(attributes)) return [instance]

    const ancestor = node.getAncestor(attributes)
    if (!ancestor) return [instance]

    return ancestor.getNodes(attributes, options)
  }

  const destroy = () => {
    if (!node) return

    cancelFetch()
    stopAutofetch()
    clearKeyboardListener()

    if (ui) ui.unmount()

    ui = null
    node.destroy()
    node = null
    payload = null
    nextPayload = null
    chartsMetadata = null
    attributes = null
    prevMetadata = null
  }

  node.type = "chart"
  node.getApplicableNodes = getApplicableNodes

  const consumePayload = () => {
    if (payload === nextPayload || nextPayload === null) return false

    const prevPayload = payload
    payload = nextPayload
    if (node) node.trigger("payloadChanged", nextPayload, prevPayload)

    return true
  }

  const instance = {
    ...node,
    getUI,
    setUI,
    getMetadata,
    setMetadataAttribute,
    setMetadataAttributes,
    getPayload,
    fetch,
    doneFetch,
    cancelFetch,
    fetchAndRender,
    getConvertedValue,
    startAutofetch,
    focus,
    blur,
    activate,
    deactivate,
    getClosestRow,
    getFirstEntry,
    getUnits,
    consumePayload,
  }

  instance.getUnitSign = makeGetUnitSign(instance)

  onKeyChange(["Alt", "Shift", "KeyF"], () => {
    if (!node) return
    node.updateAttribute("fullscreen", !node.getAttribute("fullscreen"))
  })

  onKeyChange(["Alt", "Shift", "KeyR"], () => {
    if (!node) return
    node.resetNavigation()
  })

  const dimensions = makeDimensions(instance, sdk)

  const track = makeTrack(instance)

  return {
    ...instance,
    ...dimensions,
    ...makeFilterControllers(instance),
    track,
    destroy,
    onKeyChange,
    fetchAndRender,
  }
}
