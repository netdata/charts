import { unregister } from "@/helpers/makeListeners"
import makeChartUI from "@/sdk/makeChartUI"

export const initialValue = { labels: [], data: [], values: {}, tree: {} }

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let groupBoxData = initialValue
  let groupBoxRowData = null
  let offs

  let initialized = false

  const mount = () => {
    chartUI.mount()
    updateGroupBox()

    chartUI.trigger("resize")

    offs = unregister(
      chart.onAttributeChange("hoverX", updateGroupBoxRowData),
      chart.on("finishFetch", () => updateGroupBox({ force: true })),
      chart.on("visibleDimensionsChanged", () => updateGroupBox({ force: true })),
      chart.onAttributeChange("theme", () => updateGroupBox({ force: true }))
    )
  }

  const unmount = () => {
    if (offs) offs()
    offs = null
    chartUI.unmount()
  }

  const updateGroupBox = ({ force = false } = {}) => {
    if (initialized && !force && !chart.consumePayload()) return false

    const payload = chart.getPayload()

    if (!payload.data.length) return false

    groupBoxData = payload

    updateGroupBoxRowData()

    initialized = true

    chartUI.render()
    chartUI.trigger("groupBoxChanged", groupBoxData)
    return true
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
    return true
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
