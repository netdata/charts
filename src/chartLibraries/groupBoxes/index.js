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
    updateGroupBox()

    offs = unregister(
      chart.on("successFetch", updateGroupBox),
      chart.onAttributeChange("hoverX", updateGroupBoxLayout)
    )
  }

  const unmount = () => {
    if (offs) offs()
    offs = null
  }

  const updateGroupBox = () => {
    groupBoxData = transform(chart)
    updateGroupBoxLayout()
  }

  const updateGroupBoxLayout = () => {
    const { result } = chart.getPayload()
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

    groupBoxLayout = { labels: groupBoxData.labels, data }

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
