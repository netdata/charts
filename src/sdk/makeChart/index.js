import makeKeyboardListener from "@/helpers/makeKeyboardListener"
import makeNode from "../makeNode"
import convert from "../unitConversion"
import { fetchChartData } from "./api"
import makeDimensions from "./makeDimensions"
import makeFilterControllers from "./filters/makeControllers"
import makeDataFetch from "./makeDataFetch"
import makeGetUnitSign from "./makeGetUnitSign"
import makeWeights from "./makeWeights"

const maxBackoffMs = 30 * 1000

const defaultMakeTrack = () => value => value

export default ({
  sdk,
  parent,
  getChart = fetchChartData,
  attributes,
  makeTrack = defaultMakeTrack,
} = {}) => {
  let node = makeNode({ sdk, parent, attributes })
  node.getChart = getChart

  let fetchTimeoutId = null

  node.backoffMs = null
  node.backoff = ms => {
    if (ms) {
      node.backoffMs = ms
      return
    }
    const tmpBackoffMs = node.backoffMs ? node.backoffMs * 2 : getUpdateEvery()
    node.backoffMs = tmpBackoffMs > maxBackoffMs ? maxBackoffMs : tmpBackoffMs
  }

  let uiInstances = {}

  const getUpdateEvery = () => {
    if (!node) return

    const { loaded, viewUpdateEvery, updateEvery } = node.getAttributes()
    if (viewUpdateEvery) return viewUpdateEvery * 1000

    return loaded ? updateEvery * 1000 || 1000 : 0
  }

  node.startAutofetch = () => {
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
      node.backoffMs || updateEveryMs - Math.round((div - Math.floor(div)) * updateEveryMs)

    clearTimeout(fetchTimeoutId)
    fetchTimeoutId = setTimeout(() => {
      node.startAutofetch()
    }, remaining)
  }

  node.getUI = (uiName = "default") => uiInstances[uiName]
  node.setUI = (newUi, uiName = "default") => {
    uiInstances[uiName] = newUi
  }

  const render = () => Object.keys(uiInstances).forEach(uiName => uiInstances[uiName].render())

  node.on("render", render)

  node.getConvertedValue = (value, { fractionDigits } = {}) => {
    if (!node) return

    if (value === null) return "-"

    const { unitsConversionMethod, unitsConversionDivider, unitsConversionFractionDigits } =
      node.getAttributes()
    const converted = convert(node, unitsConversionMethod, value, unitsConversionDivider)

    if (unitsConversionFractionDigits === -1) return converted

    return Intl.NumberFormat(undefined, {
      useGrouping: true,
      minimumFractionDigits: isNaN(fractionDigits) ? unitsConversionFractionDigits : fractionDigits,
      maximumFractionDigits: isNaN(fractionDigits) ? unitsConversionFractionDigits : fractionDigits,
    }).format(converted)
  }

  node.focus = event => {
    if (!node) return

    if (node.getAttribute("focused") && node.getAttribute("hovering")) return

    node.updateAttributes({ focused: true, hovering: true })
    sdk.trigger("hoverChart", node, event)
    node.trigger("hoverChart", event)
  }

  node.blur = event => {
    if (!node) return

    if (!node.getAttribute("focused") && !node.getAttribute("hovering")) return

    node.updateAttributes({ focused: false, hovering: false })
    sdk.trigger("blurChart", node, event)
    node.trigger("blurChart", event)
  }

  node.activate = () => {
    if (!node) return
    node.updateAttribute("active", true)
    sdk.trigger("active", node, true)
  }

  node.deactivate = () => {
    if (!node) return
    node.updateAttribute("active", false)
    sdk.trigger("active", node, false)
  }

  node.getFirstEntry = () => node.getAttribute("firstEntry")

  node.getUnits = () => {
    if (!node) return

    const { units } = node.getAttributes()
    return units
  }

  node.getApplicableNodes = (attributes, options) => {
    if (!node) return []

    if (!node.match(attributes)) return [node]

    const ancestor = node.getAncestor(attributes)
    if (!ancestor) return [node]

    return ancestor.getNodes(attributes, options)
  }

  node.fetchAndRender = ({ initialize = false } = {}) => {
    if (!!node && initialize) node.updateAttribute("loaded", false)

    return node.fetch().then(render)
  }

  node.stopAutofetch = (force = true) => {
    clearTimeout(fetchTimeoutId)

    if (!node || !force) return

    if (
      !node.getAttribute("active") &&
      node.getAttribute("loaded") &&
      node.getAttribute("loading")
    ) {
      node.cancelFetch()
    }
  }

  makeDimensions(node, sdk)
  makeDataFetch(node, sdk)
  makeWeights(node, sdk)

  node.type = "chart"
  makeGetUnitSign(node)

  node.track = makeTrack(node)

  const { onKeyChange, initKeyboardListener, clearKeyboardListener } = makeKeyboardListener()

  onKeyChange(["Alt", "Shift", "KeyF"], () => {
    if (!node) return
    node.updateAttribute("fullscreen", !node.getAttribute("fullscreen"))
  })

  onKeyChange(["Alt", "Shift", "KeyR"], () => {
    if (!node) return
    node.resetNavigation()
  })

  node.onAttributeChange("autofetch", autofetch => {
    if (autofetch) {
      node.startAutofetch()
    } else {
      node.stopAutofetch(false)
    }
  })

  node.onAttributeChange("active", active => {
    if (!node) return

    if (!active) return node.stopAutofetch()
    if (node.getAttribute("autofetch")) return node.startAutofetch()
  })

  node.onAttributeChange("focused", focused => {
    if (!node) return

    focused ? initKeyboardListener() : clearKeyboardListener()
    node.invalidateClosestRowCache()
  })

  node.makeChartUI = (uiName, chartLibrary = node.getAttribute("chartLibrary")) => {
    if (!(chartLibrary in sdk.ui))
      console.error(
        `Chart library "${chartLibrary}" does not exist in ${Object.keys(sdk.ui).join(", ")}`
      )

    const makeChartLibrary = sdk.ui[chartLibrary]

    const chartUi = makeChartLibrary(sdk, node)
    node.setUI(chartUi, uiName)
  }

  node.makeSubChart = (options = {}) => {
    const subChart = sdk.makeChartCore(options)
    const chartUi = sdk.makeChartUI(subChart)
    subChart.setUI(chartUi, "default")

    return subChart
  }

  const destroy = () => {
    if (!node) return

    node.cancelFetch()
    node.stopAutofetch()
    clearKeyboardListener()

    Object.keys(uiInstances).forEach(uiName => uiInstances[uiName].unmount())

    uiInstances = null
    node.destroy()
    node = null
  }

  return {
    ...node,
    ...makeFilterControllers(node),
    destroy,
    onKeyChange,
  }
}
