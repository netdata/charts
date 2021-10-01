import { useEffect, useState } from "react"
import { unregister } from "@/helpers/makeListeners"
import makeExecuteLatest from "@/helpers/makeExecuteLatest"
import { useChart, useAttributeValue } from "@/components/provider"

export default id => {
  const [visible, setVisible] = useState(false)
  const chart = useChart()

  const overlays = useAttributeValue("overlays")
  const { range } = overlays[id]

  useEffect(() => {
    const { add, clear } = makeExecuteLatest()
    const off = unregister(
      chart.onAttributeChange(
        "hoverX",
        add((positionX, prevPositionX) => {
          const [x] = positionX || prevPositionX || []
          if (!chart.getAttribute("focused")) return
          setVisible(range[0] < x / 1000 && range[1] > x / 1000)
        })
      ),
      chart.onAttributeChange(
        "focused",
        add(focused => {
          if (focused) return
          setVisible(false)
        })
      )
    )

    return () => {
      off()
      clear()
    }
  }, [chart, range])

  return visible
}
