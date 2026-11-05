import { useMemo } from "react"
import { useChart, useDimensionIds, useAttributeValue } from "@/components/provider"


export const useTableMatrix = () => {
  const chart = useChart()
  const dimensionIds = useDimensionIds()
  const searchQuery = useAttributeValue("searchQuery")
  const hover = useAttributeValue("hoverX")

  const groups = chart.getDimensionGroups()
  const tableColumns = chart.getAttribute("tableColumns")

  const [rowGroups, contextGroups, labels] = useMemo(() => {
    return chart.getTableMatrix()
  }, [chart, dimensionIds, groups, tableColumns])

  const matcher = useMemo(() => {
    if (!searchQuery) return null
    try {
      const re = new RegExp(searchQuery)
      return value => re.test(value)
    } catch {
      return value => value.includes(searchQuery)
    }
  }, [searchQuery])

  const data = useMemo(() => {
    return Object.keys(rowGroups).reduce((h, g) => {
      if (matcher && !matcher(g)) return h

      h.push({
        key: g,
        ids: matcher ? rowGroups[g].filter(matcher) : rowGroups[g],
        contextGroups,
      })
      return h
    }, [])
  }, [matcher, rowGroups, hover, contextGroups])

  return {
    rowGroups,
    contextGroups,
    labels,
    data,
    groups,
    tableColumns,
    dimensionIds,
  }
}

export default useTableMatrix
