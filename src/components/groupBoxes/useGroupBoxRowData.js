import { useChart, useForceUpdate, useImmediateListener } from "@/components/provider"

export default uiName => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.getUI(uiName).on("groupBoxRowDataChanged", forceUpdate), [chart])

  return chart.getUI(uiName).getGroupBoxRowData()
}
