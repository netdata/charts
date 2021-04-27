import makeListeners from "@/helpers/makeListeners"
import makeContainer from "./makeContainer"
import makeChart from "./makeChart"
import initialAttributes from "./initialAttributes"

export default ({
  defaultUI,
  ui,
  plugins: defaultPlugins = {},
  attributes: defaultAttributes,
  on = {},
}) => {
  const listeners = makeListeners()
  const attributes = { defaultUI, ui }
  const root = makeContainer({ id: "root", ...initialAttributes, ...defaultAttributes })

  const plugins = {}
  Object.keys(defaultPlugins).forEach(name => register(name, defaultPlugins[name]))

  Object.keys(on).forEach(name => listeners.on(name, on[name]))

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

  const makeChartCore = attributes => makeChart({ sdk: instance, attributes })

  const makeChartUI = chart => {
    const type = chart.getAttribute("type") || attributes.defaultUI
    const makeChartUI = attributes.ui[type]

    return makeChartUI(instance, chart)
  }

  const makeSDKChart = (attributes = {}) => {
    const chart = makeChartCore(attributes)
    const ui = makeChartUI(chart)
    chart.setUi(ui)

    return chart
  }

  const makeSDKContainer = (attributes = {}) => makeContainer({ sdk: instance, attributes })

  const getNodes = attributes => root.getNodes(attributes, [root])

  const appendChild = (node, { inherit = true } = {}) => root.appendChild(node, { inherit })

  const instance = {
    getRoot,
    register,
    unregister,
    addUI,
    makeChartCore,
    makeChartUI,
    makeChart: makeSDKChart,
    makeContainer: makeSDKContainer,
    getNodes,
    appendChild,
  }

  return instance
}
