import makeListeners from "@/helpers/makeListeners"
import makeContainer from "./makeContainer"
import makeChart from "./makeChart"
import makeChartsMetadata from "./makeChartsMetadata"
import initialAttributes from "./initialAttributes"

export default ({
  ui,
  plugins: defaultPlugins = {},
  attributes: defaultAttributes,
  on = {},
  getChartMetadata,
  chartsMetadata = makeChartsMetadata({ getChart: getChartMetadata }),
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

  const addUI = (type, chartLibrary) => {
    attributes.ui[type] = chartLibrary
  }

  const makeChartCore = options => makeChart({ sdk: instance, ...options })

  const makeChartUI = chart => {
    const chartLibrary = chart.getAttribute("chartLibrary") || defaultAttributes.chartLibrary

    if (!(chartLibrary in attributes.ui))
      console.error(
        `Chart library "${chartLibrary}" does not exist in ${Object.keys(attributes.ui).join(", ")}`
      )

    const makeChartLibrary = attributes.ui[chartLibrary]

    return makeChartLibrary(instance, chart)
  }

  const makeSDKChart = ({ ui, ...options }) => {
    const chart = makeChartCore(options)
    const chartUi = makeChartUI(chart)
    chart.setUI({ ...chartUi, ...ui })

    return chart
  }

  const makeSDKContainer = options => makeContainer({ sdk: instance, ...options })

  const getNode = (attributes, options) => root.getNode(attributes, options)

  const getNodes = (attributes, options) => root.getNodes(attributes, options)

  const appendChild = (node, { inherit = true } = {}) => root.appendChild(node, { inherit })

  const removeChild = id => root.removeChild(id)

  const instance = {
    ...listeners,
    chartsMetadata,
    getRoot,
    register,
    unregister,
    addUI,
    makeChartCore,
    makeChartUI,
    makeChart: makeSDKChart,
    makeContainer: makeSDKContainer,
    getNode,
    getNodes,
    appendChild,
    removeChild,
  }

  init()

  return instance
}
