import {
  useChartUI,
  useForceUpdate,
  useImmediateListener,
} from "@/components/provider"
import { initialValue } from "@/chartLibraries/groupBoxes"

export default uiName => {
  const chartUI = useChartUI(uiName)
  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chartUI.on("groupBoxChanged", forceUpdate), [chartUI])

  return chartUI.getGroupBox?.() || initialValue
}
