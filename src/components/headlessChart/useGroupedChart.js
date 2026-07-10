import { useMemo } from "react"
import useHeadlessChart from "./useHeadlessChart"

const flattenTree = node => {
  if (typeof node === "string") return [node]
  return Object.values(node).flatMap(flattenTree)
}

const getGroupLevel = tree => {
  const keys = Object.keys(tree)
  if (keys.length !== 1) return tree

  const child = tree[keys[0]]
  if (typeof child === "string") return tree

  return getGroupLevel(child)
}

const useGroupedChart = ({ sharedMinMax = false } = {}) => {
  const { chart, data, helpers, state, hover, dimensionIds, ...rest } = useHeadlessChart()

  const groups = useMemo(() => {
    const payload = chart.getPayload()
    const { tree } = payload

    if (!tree || !Object.keys(tree).length) return []

    const { data: rawData = [] } = payload
    if (!rawData.length) return []

    const hoverX = chart.getAttribute("hoverX")
    const rowIndex = hoverX ? chart.getClosestRow(hoverX[0]) : rawData.length - 1

    const groupTree = getGroupLevel(tree)

    const groupEntries = Object.entries(groupTree).map(([key, subTree]) => {
      const groupDimensionIds = flattenTree(subTree)

      const dimensions = groupDimensionIds.map(id => {
        const value = chart.getDimensionValue(id, rowIndex, { abs: false })
        return {
          id,
          value,
          convertedValue: chart.getConvertedValue(value, { dimensionId: id }),
          color: chart.selectDimensionColor(id),
          name: chart.getDimensionName?.(id) || id,
        }
      })

      const value = dimensions.reduce((sum, d) => sum + (d.value || 0), 0)

      return {
        key,
        label: key,
        dimensionIds: groupDimensionIds,
        value,
        dimensions,
      }
    })

    if (sharedMinMax) {
      const allValues = groupEntries.flatMap(g => g.dimensions.map(d => d.value || 0))
      const globalMin = Math.min(...allValues)
      const globalMax = Math.max(...allValues)
      return groupEntries.map(g => ({ ...g, min: globalMin, max: globalMax }))
    }

    return groupEntries.map(g => {
      const values = g.dimensions.map(d => d.value || 0)
      return {
        ...g,
        min: Math.min(...values),
        max: Math.max(...values),
      }
    })
  }, [chart, data, hover, dimensionIds])

  return { groups, chart, helpers, state, ...rest }
}

export default useGroupedChart
