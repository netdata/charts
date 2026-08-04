import {
  useChartUI,
  useForceUpdate,
  useImmediateListener,
} from "@/components/provider"

export default uiName => {
  const chartUI = useChartUI(uiName)
  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chartUI.on("groupBoxRowDataChanged", forceUpdate), [chartUI])

  return chartUI.getGroupBoxRowData()
}
