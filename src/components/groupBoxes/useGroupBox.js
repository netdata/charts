import { useChart, useForceUpdate, useImmediateListener } from "@/components/provider"

export default () => {
  const chart = useChart()

  const forceUpdate = useForceUpdate()

  useImmediateListener(() => chart.getUI().on("groupBoxChanged", forceUpdate), [chart])

  return chart.getUI().getGroupBox()
}
