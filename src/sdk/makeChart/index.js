import makeKeyboardListener from "@/helpers/makeKeyboardListener"
import makeNode from "../makeNode"
import convert from "../unitConversion"
import { fetchChartData, errorCodesToMessage } from "./api"
import makeDimensions from "./makeDimensions"
import makeGetClosestRow from "./makeGetClosestRow"
import getInitialFilterAttributes from "./filters/getInitialAttributes"
import makeFilterControllers from "./filters/makeControllers"
import makeGetUnitSign from "./makeGetUnitSign"
import makeWeights from "./makeWeights"
import camelizePayload from "./camelizePayload"

const maxBackoffMs = 30 * 1000

const defaultMakeTrack = () => value => value

const initialPayload = {
  labels: [],
  data: [],
  all: [],
  tree: {},
}

export default ({
  sdk,
  parent,
  getChart = fetchChartData,
  attributes,
  makeTrack = defaultMakeTrack,
} = {}) => {
  let node = makeNode({ sdk, parent, attributes })
  let ui = null
  let abortController = null
  let payload = initialPayload
  let nextPayload = null
  let fetchTimeoutId = null

  let backoffMs = null
  const backoff = ms => {
    if (ms) {
      backoffMs = ms
      return
    }
    const tmpBackoffMs = backoffMs ? backoffMs * 2 : getUpdateEvery()
    backoffMs = tmpBackoffMs > maxBackoffMs ? maxBackoffMs : tmpBackoffMs
  }

  const getPayload = () => payload

  const { invalidateClosestRowCache, getClosestRow } = makeGetClosestRow(getPayload)

  const cancelFetch = () => abortController && abortController.abort()

  const getUpdateEvery = () => {
    if (!node) return

    const { loaded, viewUpdateEvery: viewUpdateEveryAttribute } = node.getAttributes()
    if (viewUpdateEveryAttribute) return viewUpdateEveryAttribute * 1000

    const { viewUpdateEvery, updateEvery } = node.getAttributes()
    if (loaded && viewUpdateEvery) return viewUpdateEvery * 1000

    return updateEvery * 1000 || 2000
  }

  const startAutofetch = () => {
    if (!node) return

    const { fetchStartedAt, loading, autofetch, active, paused } = node.getAttributes()

    if (!autofetch || loading || !active || paused) return

    if (fetchStartedAt === 0) {
      node.trigger("fetch")
      return
    }

    const fetchingPeriod = Date.now() - fetchStartedAt
    const updateEveryMs = getUpdateEvery()
    const div = fetchingPeriod / updateEveryMs
    const updateEveryMultiples = Math.floor(div)

    if (updateEveryMultiples >= 1) {
      node.trigger("fetch")
      return
    }

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

  const getDataLength = payload => {
    const { data } = payload || initialPayload
    return data?.length || 0
  }

  const doneFetch = nextRawPayload => {
    backoffMs = 0
    const { result, chartType, versions, ...restPayload } = camelizePayload(nextRawPayload)

    const prevPayload = nextPayload
    nextPayload = result

    const dataLength = getDataLength(nextPayload)
    if (
      !node.getAttribute("loaded") ||
      (dataLength > 0 && getDataLength(payload) === 0) ||
      (getDataLength(payload) > 0 && dataLength === 0)
    )
      consumePayload()

    invalidateClosestRowCache()

    if (!node.getAttribute("loaded")) node.getParent().trigger("chartLoaded", node)

    const wasLoaded = node.getAttribute("loaded")

    const attributes = node.getAttributes()

    node.updateAttributes({
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

    dimensions.sortDimensions()
    dimensions.updateColors()

    if (!node.getAttribute("initializedFilters"))
      node.setAttributes(getInitialFilterAttributes(node))

    if (wasLoaded) node.trigger("successFetch", nextPayload, prevPayload)

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
    if (!node) return

    const container = node.getParent()
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
    if (!node) return

    if (error?.name === "AbortError") {
      node.updateAttribute("loading", false)
      return
    }

    backoff()
    if (!error || error.name !== "AbortError") node.trigger("failFetch", error)

    if (!node.getAttribute("loaded")) node.getParent().trigger("chartLoaded", node)

    node.updateAttributes({
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

  const dataFetch = () => {
    abortController = new AbortController()
    const options = { signal: abortController.signal }

    return getChart(node, options)
      .then(data => {
        if (data?.errorMsgKey) return failFetch(data)
        if (!(Array.isArray(data?.result) || Array.isArray(data?.result?.data))) return failFetch()

        return doneFetch(data)
      })
      .catch(failFetch)
  }

  const isNewerThanRetention = () => {
    if (!node) return false

    const { firstEntry, after, before } = node.getAttributes()
    const absoluteBefore = after >= 0 ? before : Date.now() / 1000
    return !firstEntry || firstEntry <= absoluteBefore
  }

  const fetch = () => {
    if (!node) return

    cancelFetch()
    node.trigger("startFetch")
    node.updateAttributes({ loading: true, fetchStartedAt: Date.now() })

    if (!isNewerThanRetention())
      return Promise.resolve().then(() =>
        failFetch({ message: "Exceeds agent data retention settings" })
      )

    return dataFetch()
  }

  node.on("fetch", fetch)

  const getUI = () => ui
  const setUI = newUi => {
    ui = newUi
  }

  const render = () => ui && ui.render()

  const fetchAndRender = ({ initialize = false } = {}) => {
    if (!!node && initialize) node.updateAttribute("loaded", false)

    return fetch().then(render)
  }

  const getConvertedValue = (value, { fractionDigits } = {}) => {
    if (!node) return

    if (value === null) return "-"

    const { unitsConversionMethod, unitsConversionDivider, unitsConversionFractionDigits } =
      node.getAttributes()
    const converted = convert(node, unitsConversionMethod, value, unitsConversionDivider)

    if (unitsConversionFractionDigits === -1) return converted

    return Intl.NumberFormat(undefined, {
      useGrouping: true,
      minimumFractionDigits: fractionDigits || unitsConversionFractionDigits,
      maximumFractionDigits: fractionDigits || unitsConversionFractionDigits,
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
    sdk.trigger("active", node, true)
  }

  const deactivate = () => {
    if (!node) return
    node.updateAttribute("active", false)
    sdk.trigger("active", node, false)
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

  const getFirstEntry = () => node.getAttribute("firstEntry")

  const getUnits = () => {
    if (!node) return

    const { units } = node.getAttributes()
    return units
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

    if (!node.match(attributes)) return [node]

    const ancestor = node.getAncestor(attributes)
    if (!ancestor) return [node]

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

  node = {
    ...node,
    getUI,
    setUI,
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

  node.getUnitSign = makeGetUnitSign(node)

  onKeyChange(["Alt", "Shift", "KeyF"], () => {
    if (!node) return
    node.updateAttribute("fullscreen", !node.getAttribute("fullscreen"))
  })

  onKeyChange(["Alt", "Shift", "KeyR"], () => {
    if (!node) return
    node.resetNavigation()
  })

  const dimensions = makeDimensions(node, sdk)
  const weights = makeWeights(node, sdk)

  const track = makeTrack(node)

  return {
    ...node,
    ...dimensions,
    ...weights,
    ...makeFilterControllers(node),
    track,
    destroy,
    onKeyChange,
  }
}
