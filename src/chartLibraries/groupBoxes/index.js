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

  const mount = () => {
    chart.consumePayload()

    updateGroupBox()

    offs = unregister(
      chart.on("successFetch", updateGroupBox),
      chart.onAttributeChange("hoverX", updateGroupBoxLayout),
      chart.onAttributeChange("filteredRows", updateGroupBox)
    )
  }

  const unmount = () => {
    if (offs) offs()
    offs = null
  }

  const updateGroupBox = () => {
    chart.consumePayload()

    const { result } = chart.getPayload()
    if (result.data.length === 0) return

    groupBoxData = transform(chart)
    updateGroupBoxLayout()
  }

  const updateGroupBoxLayout = () => {
    const { result } = chart.getPayload()
    if (result.data.length === 0) return

    const hoverX = chart.getAttribute("hoverX")
    const row = hoverX ? chart.getClosestRow(hoverX[0]) : -1

    const data = groupBoxData.data.map(groupedBox => {
      return {
        labels: groupedBox.labels,
        data:
          row === -1
            ? groupedBox.postAggregations
            : groupedBox.indexes.map(index => result.data[row][index + 1]),
      }
    })

    groupBoxLayout = { labels: groupBoxData.labels, data, raw: groupBoxData }

    chartUI.trigger("groupBoxLayoutChanged", groupBoxLayout)
  }

  const getGroupBoxLayout = () => groupBoxLayout

  const instance = {
    ...chartUI,
    mount,
    unmount,
    format: "json",
    getUrlOptions,
    getGroupBoxLayout,
  }

  return instance
}
