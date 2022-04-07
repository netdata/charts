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

  const getMetadataDecorator = () => chartsMetadata || sdk.chartsMetadata

  const getPayload = () => payload

  const { invalidateClosestRowCache, getClosestRow } = makeGetClosestRow(getPayload)

  const cancelFetch = () => abortController && abortController.abort()

  const getMetadata = () => getMetadataDecorator().get(instance) || initialMetadata
  const fetchMetadata = () => getMetadataDecorator().fetch(instance)

  const getUpdateEvery = () => {
    const { loaded, updateEvery: updateEveryAttribute } = node.getAttributes()
    if (updateEveryAttribute) return updateEveryAttribute * 1000

    const { viewUpdateEvery } = getPayload()
    if (loaded && viewUpdateEvery) return viewUpdateEvery * 1000

    const { updateEvery } = getMetadata()
    return updateEvery * 1000 || 2000
  }

  const startAutofetch = () => {
    const { fetchStartedAt, loading, autofetch, active } = node.getAttributes()

    if (!autofetch || loading || !active) return

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

  const getDataLength = ({ result }) => (Array.isArray(result) ? result.length : result.data.length)

  const doneFetch = (nextRawPayload, { errored = false } = {}) => {
    if (!errored) backoffMs = 0
    const nextPayloadTransformed = camelizePayload(nextRawPayload)

    const result = transformResult(nextPayloadTransformed)

    const { dimensionIds, ...restPayload } = nextPayloadTransformed

    const prevPayload = nextPayload
    if (deepEqual(payload.dimensionIds, dimensionIds)) {
      nextPayload = {
        ...initialPayload,
        ...nextPayload,
        ...restPayload,
        result,
      }
    } else {
      nextPayload = { ...initialPayload, ...nextPayloadTransformed, result }
    }

    const dataLength = getDataLength(nextPayload)
    if (
      !node.getAttribute("loaded") ||
      (dataLength > 0 && getDataLength(payload) === 0) ||
      (getDataLength(payload) > 0 && dataLength === 0)
    )
      consumePayload()

    invalidateClosestRowCache()

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
      const { firstEntry } = metadata
      const { after, before } = node.getAttributes()
      const absoluteBefore = after >= 0 ? before : Date.now() / 1000
      return firstEntry && firstEntry <= absoluteBefore
    }

    return false
  }

  const fetch = () => {
    node.trigger("startFetch")
    node.updateAttributes({ loading: true, fetchStartedAt: Date.now() })

    const { fullyLoaded } = getMetadata()

    if (!fullyLoaded) {
      updateMetadata()
      if (!isNewerThanRetention()) {
        return Promise.resolve().then(() => doneFetch(initialPayload, { errored: true }))
      }
      return dataFetch()
    }

    return fetchMetadata()
      .catch(error => {
        // Do not throw (but rather resolve the promise) if the error is due to filters changing.
        // It is not a chart data error, but rather metadata issue.
        if (error.message === "not_found" && error.cause === "filters") return

        throw error
      })
      .then(() => {
        updateMetadata()
        if (!isNewerThanRetention()) {
          return Promise.resolve().then(() => doneFetch(initialPayload, { errored: true }))
        }
        return dataFetch()
      })
      .catch(failFetch)
  }

  const updateMetadata = () => {
    const metadata = getMetadata()

    if (metadata === prevMetadata) return
    node.setAttribute("dimensions", Object.keys(metadata.dimensions))
    node.trigger("metadataChanged")

    if (node.getAttribute("composite")) {
      const attributes = getInitialFilterAttributes(instance)
      node.setAttributes(attributes)
    }

    prevMetadata = metadata
  }

  const getUI = () => ui
  const setUI = newUi => {
    ui = newUi
  }

  const fetchAndRender = () => fetch().then(() => ui && ui.render())

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
    if (!active) return stopAutofetch()
    if (node.getAttribute("autofetch")) return startAutofetch()
  })

  const {
    onKeyChange,
    onKeyAndMouse,
    initKeyboardListener,
    clearKeyboardListener,
  } = makeKeyboardListener()

  node.onAttributeChange("focused", focused => {
    focused ? initKeyboardListener() : clearKeyboardListener()
    invalidateClosestRowCache()
  })

  const getApplicableNodes = (attributes, options) => {
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
    node.trigger("payloadChanged", nextPayload, prevPayload)

    return true
  }

  const instance = {
    ...node,
    getUI,
    setUI,
    getMetadata,
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
    node.updateAttribute("fullscreen", !node.getAttribute("fullscreen"))
  })

  onKeyChange(["Alt", "Shift", "KeyR"], () => {
    node.resetNavigation()
  })

  const dimensions = makeDimensions(instance)

  const onDimensionToggle = onKeyAndMouse(
    ["Shift", "Control"],
    id => ({ allPressed }) => dimensions.toggleDimensionId(id, { merge: allPressed !== "none" }),
    { allPressed: false }
  )

  const track = makeTrack(instance)

  return {
    ...instance,
    ...dimensions,
    ...makeFilterControllers(instance),
    track,
    destroy,
    onKeyChange,
    onKeyAndMouse,
    onDimensionToggle,
    fetchAndRender,
  }
}
