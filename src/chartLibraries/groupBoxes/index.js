import { unregister } from "@/helpers/makeListeners"
import makeChartUI from "@/sdk/makeChartUI"
import transform from "./transform"

const initialValue = { labels: [], data: [], values: {}, tree: {} }

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let groupBoxData = initialValue
  let groupBoxRowData = null
  let offs

  let initialized = false

  const mount = () => {
    updateGroupBox()

    offs = unregister(
      chart.onAttributeChange("hoverX", updateGroupBoxRowData),
      chart.on("finishFetch", () => updateGroupBox({ force: true })),
      chart.on("visibleDimensionsChanged", () => updateGroupBox({ force: true }))
    )
  }

  const unmount = () => {
    if (offs) offs()
    offs = null
  }

  const updateGroupBox = ({ force = false } = {}) => {
    if (initialized && !force && !chart.consumePayload()) return

    const { data } = chart.getPayload()
    if (data.length === 0) return

    groupBoxData = transform(chart)

    updateGroupBoxRowData()

    initialized = true

    chartUI.trigger("groupBoxChanged", groupBoxData)
  }

  const getGroupBox = () => groupBoxData

  const updateGroupBoxRowData = () => {
    const { all } = chart.getPayload()

    if (all.length === 0) return

    const hoverX = chart.getAttribute("hoverX")
    const row = hoverX ? chart.getClosestRow(hoverX[0]) : -1

    if (!groupBoxData) return

    groupBoxRowData = row === -1 ? all[all.length - 1] : all[row]
    if (row !== -1 && !Array.isArray(groupBoxRowData)) {
      groupBoxRowData = null
      return
    }

    chartUI.trigger("groupBoxRowDataChanged", groupBoxRowData)
  }

  const getGroupBoxRowData = () => groupBoxRowData

  const render = () => {
    chartUI.render()

    chartUI.trigger("rendered")
  }

  const instance = {
    ...chartUI,
    mount,
    unmount,
    render,
    getGroupBox,
    getGroupBoxRowData,
  }

  return instance
}
