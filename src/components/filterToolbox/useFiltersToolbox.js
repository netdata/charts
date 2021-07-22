import { useState, useEffect } from "react"
import { unregister } from "@/helpers/makeListeners"
import { useChart, useAttributeValue } from "@/components/provider/selectors"

export default () => {
  const chart = useChart()

  const groupBy = useAttributeValue("groupBy")

  const getDimensionAggregation = () => {
    const dimensions = chart.getAttribute("dimensions")
    return dimensions.length > 0
  }

  const [hasDimensions, setHasDimensions] = useState(getDimensionAggregation)

  useEffect(
    () =>
      unregister(
        chart.onAttributeChange("dimensions", () => setHasDimensions(getDimensionAggregation()))
      ),
    [chart]
  )

  const getTotalChartIds = () => {
    const { nodes } = chart.getPayload()
    return nodes.reduce((acc, node) => acc + node.chartIDs.length, 0)
  }

  const [totalChartIds, setTotalChartIds] = useState(getTotalChartIds)

  useEffect(
    () =>
      chart.on(
        "successFetch",
        (next, prev) => next.nodes !== prev.nodes && setTotalChartIds(getTotalChartIds())
      ),
    [chart]
  )

  return {
    aggregate: totalChartIds > 0 && groupBy !== "chart",
    dimensionAggregation: groupBy === "dimension" && hasDimensions,
  }
}
