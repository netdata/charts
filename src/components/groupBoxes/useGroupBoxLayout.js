import { useState } from "react"
import { useChart, useImmediateListener } from "@/components/provider"

export default () => {
  const chart = useChart()

  const getValue = () => chart.getUI().getGroupBoxLayout()
  const [value, setValue] = useState(getValue)

  useImmediateListener(
    () => chart.getUI().on("groupBoxLayoutChanged", () => setValue(getValue)),
    [chart]
  )

  return value
}
