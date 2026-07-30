import makeListeners from "@/helpers/makeListeners"
import makeContainer from "./makeContainer"
import makeChart from "./makeChart"
import initialAttributes from "./initialAttributes"
import makeDataQuery from "./dataQuery"

export default ({
  ui,
  plugins: defaultPlugins = {},
  attributes: defaultAttributes = {},
  on = {},
  rendererPolicy = null,
}) => {
  const listeners = makeListeners()
  const attributes = { ui }
  const plugins = {}
  let root

  const init = () => {
    root = makeSDKContainer({
      attributes: { id: "root", ...initialAttributes, ...defaultAttributes },
    })
    Object.keys(on).forEach(name => listeners.on(name, on[name]))
    Object.keys(defaultPlugins).forEach(name => register(name, defaultPlugins[name]))
  }

  const getRoot = () => root

  const register = (name, plugin) => {
    plugins[name] = plugin(instance)
  }

  const unregister = name => {
    plugins[name]()
    delete plugins[name]
  }

  const version = () => attributes._v

  const addUI = (type, chartLibrary) => {
    attributes.ui[type] = chartLibrary
  }

  const makeChartCore = options => makeChart({ sdk: instance, ...options })

  const getPreferredRenderer = (chart, visualization) =>
    rendererPolicy?.({ chart, visualization, sdk: instance }) || null

  const makeChartUI = chart => {
    const chartLibrary = chart.getAttribute("chartLibrary", defaultAttributes.chartLibrary)
    const renderer = chart.getActiveRenderer?.() || chartLibrary

    if (!(renderer in attributes.ui))
      console.error(
        `Chart renderer "${renderer}" does not exist in ${Object.keys(attributes.ui).join(", ")}`
      )

    const makeRenderer = attributes.ui[renderer]

    return makeRenderer(instance, chart)
  }

  const makeSDKChart = (options = {}) => {
    const chart = makeChartCore(options)
    const chartUi = makeChartUI(chart)
    chart.setUI({ ...chartUi, ...options.ui }, "default")

    return chart
  }

  const makeSDKContainer = options => makeContainer({ sdk: instance, ...options })

  const getNode = (attributes, options) => root.getNode(attributes, options)

  const getNodes = (attributes, options) => root.getNodes(attributes, options)

  const appendChild = (node, { inherit = true } = {}) => root.appendChild(node, { inherit })

  const removeChild = id => root.removeChild(id)

  const queryData = makeDataQuery({ getAttributes: () => root.getAttributes() })

  const instance = {
    ...listeners,
    getRoot,
    register,
    unregister,
    addUI,
    getPreferredRenderer,
    makeChartCore,
    makeChartUI,
    makeChart: makeSDKChart,
    makeContainer: makeSDKContainer,
    getNode,
    getNodes,
    appendChild,
    removeChild,
    queryData,
    version,
    ui,
  }

  init()

  return instance
}
