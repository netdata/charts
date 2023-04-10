import makeListeners from "@/helpers/makeListeners"
import makeContainer from "./makeContainer"
import makeChart from "./makeChart"
import initialAttributes from "./initialAttributes"
import makeRTC from "./makeRTC"

export default ({ ui, plugins: defaultPlugins = {}, attributes: defaultAttributes, on = {} }) => {
  const sdk = { ...makeListeners() }
  const attributes = { ui }
  const plugins = {}
  let root

  sdk.init = () => {
    root = sdk.makeContainer({
      attributes: { id: "root", ...initialAttributes, ...defaultAttributes },
    })
    Object.keys(on).forEach(name => sdk.on(name, on[name]))
    Object.keys(defaultPlugins).forEach(name => sdk.register(name, defaultPlugins[name]))
  }

  sdk.getRoot = () => root

  sdk.register = (name, plugin) => {
    plugins[name] = plugin(sdk)
  }

  sdk.unregister = name => {
    plugins[name]()
    delete plugins[name]
  }

  sdk.version = () => attributes._v

  sdk.addUI = (type, chartLibrary) => {
    attributes.ui[type] = chartLibrary
  }

  sdk.makeChartCore = options => makeChart({ sdk, ...options })

  sdk.makeChartUI = chart => {
    const chartLibrary = chart.getAttribute("chartLibrary") || defaultAttributes.chartLibrary

    if (!(chartLibrary in attributes.ui))
      console.error(
        `Chart library "${chartLibrary}" does not exist in ${Object.keys(attributes.ui).join(", ")}`
      )

    const makeChartLibrary = attributes.ui[chartLibrary]

    return makeChartLibrary(sdk, chart)
  }

  sdk.makeChart = ({ ui, ...options }) => {
    const chart = sdk.makeChartCore(options)
    const chartUi = sdk.makeChartUI(chart)
    chart.setUI({ ...chartUi, ...ui }, "default")

    return chart
  }

  sdk.makeContainer = options => makeContainer({ sdk, ...options })

  sdk.getNode = (attributes, options) => root.getNode(attributes, options)

  sdk.getNodes = (attributes, options) => root.getNodes(attributes, options)

  sdk.appendChild = (node, { inherit = true } = {}) => root.appendChild(node, { inherit })

  sdk.removeChild = id => root.removeChild(id)

  sdk.init()

  makeRTC(sdk)

  return sdk
}
