import makeKeyboardListener from "@/helpers/makeKeyboardListener"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"
import convert from "@/helpers/units"
import makeNode from "../makeNode"
import { fetchChartData } from "./api"
import makeDimensions from "./makeDimensions"
import makeFilterControllers from "./filters/makeControllers"
import makeDataFetch from "./makeDataFetch"
import makeGetUnitSign from "./makeGetUnitSign"
import makeWeights from "./makeWeights"

const themeIndex = {
  default: 0,
  dark: 1,
}

const maxBackoffMs = 30 * 1000

const defaultMakeTrack = () => value => value

export default ({
  sdk,
  parent,
  getChart = fetchChartData,
  attributes,
  makeTrack = defaultMakeTrack,
} = {}) => {
  const executeLatest = makeExecuteLatest()

  let node = makeNode({ sdk, parent, attributes })
  node.getChart = getChart

  let fetchTimeoutId = null

  node.getRoot = () => sdk.getRoot()

  node.backoffMs = null
  node.backoff = ms => {
    if (!node) return

    if (ms) {
      node.backoffMs = ms
      return
    }
    const tmpBackoffMs = node.backoffMs ? node.backoffMs * 2 : node.getUpdateEvery()
    node.backoffMs = tmpBackoffMs > maxBackoffMs ? maxBackoffMs : tmpBackoffMs
  }

  let uiInstances = {}

  node.getUpdateEvery = () => {
    if (!node) return

    const { loaded, viewUpdateEvery, updateEvery } = node.getAttributes()
    if (viewUpdateEvery) return viewUpdateEvery * 1000

    return loaded ? updateEvery * 1000 || 1000 : 0
  }

  let cachedDateWindow = null
  let prevAfter = null
  let prevRenderedAt = null
  let prevNow = null
  node.getDateWindow = () => {
    const { after, before, renderedAt } = node.getAttributes()
    const now = sdk.getRoot().getAttribute("fetchAt") || Date.now()

    if (prevAfter === after && prevRenderedAt === renderedAt && prevNow === now)
      return cachedDateWindow

    prevAfter = after
    prevRenderedAt = renderedAt
    prevNow = now

    cachedDateWindow =
      after > 0
        ? [after * 1000, before * 1000]
        : [(renderedAt || now) + after * 1000, renderedAt || now]

    return cachedDateWindow
  }

  node.startAutofetch = () => {
    if (!node) return

    const { fetchStartedAt, loading, autofetch, active } = node.getAttributes()

    if (!autofetch || loading || !active) return

    if (node.getRoot().getAttribute("paused")) return

    if (fetchStartedAt === 0) {
      node.trigger("fetch")
      return
    }

    const fetchingPeriod = Date.now() - fetchStartedAt
    const updateEveryMs = node.getUpdateEvery()
    const div = fetchingPeriod / updateEveryMs
    const updateEveryMultiples = Math.floor(div)

    if (updateEveryMultiples >= 1) {
      node.lastFetch = node.getDateWindow()
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

  const render = executeLatest.add(() =>
    Object.keys(uiInstances).forEach(uiName => uiInstances[uiName].render())
  )

  node.on("render", render)
  node.on("hoverChart", render)
  node.on("blurChart", render)

  node.getConvertedValue = (value, { fractionDigits, key = "units", dimensionId } = {}) => {
    if (!node) return

    if (value === null) return "-"

    const {
      method,
      fractionDigits: unitsConversionFractionDigits,
      divider,
    } = node.getUnitAttributes(dimensionId, key)

    const converted = convert(node, method, value, divider)

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

    node.updateAttributes({ focused: true })
    sdk.trigger("hoverChart", node, event)
    node.trigger("hoverChart", event)
  }

  node.blur = event => {
    if (!node) return

    if (!node.getAttribute("focused") && !node.getAttribute("hovering")) return

    node.updateAttributes({ focused: false })
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
    if (!node) return

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

  node.getThemeIndex = () => {
    if (!node) return

    return themeIndex[node.getAttribute("theme")] || themeIndex.default
  }

  node.getThemeAttribute = name => {
    if (!node) return

    const attributes = node.getAttributes()
    const index = node.getThemeIndex()
    return attributes[name]?.[index] || name
  }

  const destroy = () => {
    if (!node) return

    if (executeLatest) executeLatest.clear()

    node.destroy()
    node.stopAutofetch()
    clearKeyboardListener()

    Object.keys(uiInstances).forEach(uiName => uiInstances[uiName].unmount())

    setTimeout(() => {
      uiInstances = null
      node = null
    }, 2000)

    node.destroy()
  }

  node.intl = (key, { count = 1, pluralize = true, fallback = "" } = {}) => {
    if (!node) return key

    const en = node.getAttribute("en")
    if (!en?.[key])
      return count === 1 ? fallback || key : pluralize ? `${fallback || key}s` : fallback || key

    if (typeof en[key] === "string") return en[key]

    return count === 1 ? en[key]?.one || key : en[key]?.other || (pluralize ? `${key}s` : key)
  }

  return {
    ...node,
    ...makeFilterControllers(node),
    destroy,
    onKeyChange,
    sdk,
  }
}
