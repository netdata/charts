import { useMemo } from "react"
import groupBy from "lodash/groupBy"
import isEmpty from "lodash/isEmpty"
import { useChart, useDimensionIds, useAttributeValue } from "@/components/provider"

const keepoutRegex = ".*"
const keepRegex = "(" + keepoutRegex + ")"

const applyGroupByRecursively = (obj, groupByRegex) => {
  if (Array.isArray(obj)) {
    return groupBy(obj, value => {
      const [, ...matches] = value.match(groupByRegex)
      return matches.join(",")
    })
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result = {}
    Object.keys(obj).forEach(key => {
      result[key] = applyGroupByRecursively(obj[key], groupByRegex)
    })
    return result
  }
  
  return obj
}

const groupByColumn = (result, ids, groups, attrs) => {
  if (!attrs || !Array.isArray(attrs) || attrs.length === 0) {
    return result
  }
  const [attr, ...restAttrs] = attrs
  const groupByRegex = new RegExp(
    groups.reduce((s, g) => {
      s = s + (s ? "," : "")

      if (attr === g) {
        s = s + keepRegex
      } else {
        s = s + keepoutRegex
      }

      return s
    }, "")
  )

  if (isEmpty(result)) {
    result = groupBy(ids, value => {
      const [, ...matches] = value.match(groupByRegex)
      return matches.join(",")
    })
  } else {
    Object.keys(result).forEach(key => {
      result[key] = applyGroupByRecursively(result[key], groupByRegex)
    })
  }

  if (!restAttrs.length) return result

  return groupByColumn(result, ids, groups, restAttrs)
}

export const useTableMatrix = () => {
  const chart = useChart()
  const dimensionIds = useDimensionIds()
  const searchQuery = useAttributeValue("searchQuery")
  const hover = useAttributeValue("hoverX")

  const groups = chart.getDimensionGroups()
  const { tableColumns } = chart.getAttributes()

  const [rowGroups, contextGroups, labels] = useMemo(() => {
    let forRows = []

    let groupByRegex = new RegExp(
      groups.reduce((s, g) => {
        s = s + (s ? "," : "")

        if (tableColumns.includes(g)) {
          s = s + keepoutRegex
        } else {
          s = s + keepRegex
          forRows.push(g)
        }

        return s
      }, "")
    )

    const baseGroup = groupBy(dimensionIds, value => {
      const [, ...matches] = value.match(groupByRegex)
      return matches.join(",")
    })

    let contextAndDimensionsGroup = groupByColumn({}, dimensionIds, groups, tableColumns)

    return [baseGroup, contextAndDimensionsGroup, forRows]
  }, [dimensionIds, groups, tableColumns])

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
