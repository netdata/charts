import { useState } from "react"
import { useChart, useListener } from "@/components/provider"

export default () => {
  const chart = useChart()

  const getValue = () => chart.getUI().getGroupBoxLayout()
  const [value, setValue] = useState(getValue)

  useListener(() => chart.getUI().on("groupBoxLayoutChanged", () => setValue(getValue)), [chart])

  return value
}
