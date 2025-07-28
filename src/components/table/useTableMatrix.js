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

  const data = useMemo(() => {
    return Object.keys(rowGroups).reduce((h, g) => {
      if (!!searchQuery && !new RegExp(searchQuery).test(g)) return h

      h.push({
        key: g,
        ids: searchQuery
          ? rowGroups[g].filter(rg => new RegExp(searchQuery).test(rg))
          : rowGroups[g],
        contextGroups,
      })
      return h
    }, [])
  }, [searchQuery, rowGroups, hover, contextGroups])

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
