import { useState, useEffect } from "react"
import { useChart, useAttributeValue } from "@/components/provider/selectors"

export default () => {
  const chart = useChart()

  const groupBy = useAttributeValue("groupBy")

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

  return {
    aggregate,
    prefixedDimensions: aggregate,
    totalInstances,
  }
}
