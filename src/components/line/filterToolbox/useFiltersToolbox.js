import { useState, useEffect } from "react"
import { unregister } from "@/helpers/makeListeners"
import { useChart, useAttributeValue } from "@/components/provider/selectors"

export default () => {
  const chart = useChart()

  const groupBy = useAttributeValue("groupBy")

  const getDimensionAggregation = () => {
    const dimensions = chart.getAttribute("dimensions")
    const metadata = chart.getMetadata()
    const hasDimensions =
      (metadata?.dimensions ? Object.keys(metadata.dimensions).length : dimensions.length) > 0

    const selectedDimensions = chart.getAttribute("selectedDimensions")

    return !!selectedDimensions.length || hasDimensions
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

  const getAggregate = () => {
    if (groupBy === "chart") return false
    if (totalInstances === 1) return false
    if (groupBy === "dimension") return true
    return totalInstances > 0 && totalInstances > totalNodes
  }

  const aggregate = getAggregate()
  const dimensionAggregation = groupBy !== "dimension" && hasDimensions

  return {
    aggregate,
    dimensionAggregation,
    prefixedDimensions: aggregate || dimensionAggregation,
    totalInstances,
  }
}
