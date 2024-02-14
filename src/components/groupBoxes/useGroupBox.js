import { useChart, useForceUpdate, useImmediateListener } from "@/components/provider"
import { initialValue } from "@/chartLibraries/groupBoxes"

export default uiName => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.getUI(uiName).on("groupBoxChanged", forceUpdate), [chart])

  return chart.getUI(uiName).getGroupBox?.() || initialValue
}
