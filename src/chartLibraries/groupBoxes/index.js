import { unregister } from "@/helpers/makeListeners"
import makeChartUI from "@/sdk/makeChartUI"
import transform from "./transform"

const getUrlOptions = () => ["absolute"]

const initialValue = { labels: [], data: [] }

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let groupBoxData
  let groupBoxLayout = initialValue
  let offs

  let initialized = false

  const mount = () => {
    updateGroupBox()

    offs = unregister(
      chart.onAttributeChange("hoverX", updateGroupBoxLayout),
      chart.onAttributeChange("filteredRows", () => updateGroupBox({ force: true }))
    )
  }

  const unmount = () => {
    if (offs) offs()
    offs = null
  }

  const updateGroupBox = ({ force = false } = {}) => {
    if (initialized && !force && !chart.consumePayload()) return

    const { result } = chart.getPayload()
    if (result.data.length === 0) return

    groupBoxData = transform(chart)
    updateGroupBoxLayout()
    initialized = true
  }

  const updateGroupBoxLayout = () => {
    const { result } = chart.getPayload()
    if (result.data.length === 0) return

    const hoverX = chart.getAttribute("hoverX")
    const row = hoverX ? chart.getClosestRow(hoverX[0]) : -1

    if (!groupBoxData) return

    const rowData = result.data[row]
    if (row !== -1 && !Array.isArray(rowData)) return

    const data = groupBoxData.data.map(groupedBox => {
      return {
        labels: groupedBox.labels,
        data:
          row === -1
            ? groupedBox.postAggregations
            : groupedBox.indexes.map(index => rowData[index + 1]),
      }
    })

    groupBoxLayout = { labels: groupBoxData.labels, data, raw: groupBoxData }

    chartUI.trigger("groupBoxLayoutChanged", groupBoxLayout)
  }

  const getGroupBoxLayout = () => groupBoxLayout

  const render = () => {
    chartUI.render()
    updateGroupBox()

    chartUI.trigger("rendered")
  }

  const instance = {
    ...chartUI,
    mount,
    unmount,
    render,
    format: "json",
    getUrlOptions,
    getGroupBoxLayout,
  }

  return instance
}
