import { useState, useEffect } from "react"
import { unregister } from "@/helpers/makeListeners"
import { useChart, useAttributeValue } from "@/components/provider/selectors"

export default () => {
  const chart = useChart()

  const groupBy = useAttributeValue("groupBy")

  const getDimensionAggregation = () => {
    const dimensions = chart.getAttribute("dimensions")
    const selectedDimensions = chart.getAttribute("selectedDimensions")

    return !selectedDimensions ? dimensions.length > 0 : selectedDimensions.length > 1
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
      totalInstances: nodes.reduce((acc, node) => acc + node.chartIDs.length, 0),
      totalNodes: nodes.length,
    }
  }

  const [{ totalInstances, totalNodes }, setTotals] = useState(getTotals)

  useEffect(
    () =>
      chart.on(
        "payloadChanged",
        (next, prev) => next.nodes !== prev.nodes && setTotals(getTotals())
      ),
    [chart]
  )

  const aggregate = groupBy === "dimension" || (totalInstances > 0 && totalInstances > totalNodes)
  const dimensionAggregation = groupBy !== "dimension" && hasDimensions

  return {
    aggregate,
    dimensionAggregation,
    prefixedDimensions: aggregate || dimensionAggregation,
    totalInstances,
  }
}
