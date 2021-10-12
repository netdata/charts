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

  const getTotals = () => {
    const { nodes } = chart.getPayload()
    return {
      totalChartIds: nodes.reduce((acc, node) => acc + node.chartIDs.length, 0),
      totalNodes: nodes,
    }
  }

  const [{ totalChartIds, totalNodes }, setTotals] = useState(getTotals)

  useEffect(
    () =>
      chart.on("successFetch", (next, prev) => next.nodes !== prev.nodes && setTotals(getTotals())),
    [chart]
  )

  const aggregate =
    groupBy === "dimension" || (totalChartIds > 0 && totalChartIds.length > totalNodes.length)
  const dimensionAggregation = groupBy !== "dimension" && !hasDimensions

  return {
    aggregate,
    dimensionAggregation,
    prefixedDimensions: aggregate || dimensionAggregation,
    totalChartIds,
  }
}
