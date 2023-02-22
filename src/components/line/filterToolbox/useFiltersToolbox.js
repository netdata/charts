import { useState, useEffect } from "react"
import { unregister } from "@/helpers/makeListeners"
import { useMetadata } from "@/components/provider"
import { useChart, useAttributeValue } from "@/components/provider/selectors"

export default () => {
  const chart = useChart()

  const groupBy = useAttributeValue("groupBy")

  const getDimensionAggregation = () => {
    const selectedDimensions = chart.getAttribute("selectedDimensions")

    if (selectedDimensions.length) return true

    const { dimensions } = chart.getMetadata()
    return Object.keys(dimensions).length > 0
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
    const { hosts, instances } = chart.getMetadata()

    return {
      totalInstances: instances.length,
      totalNodes: hosts.length,
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
