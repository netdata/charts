import dimensionColors from "./theme/dimensionColors"

export default chart => {
  let prevDimensionIds = []
  let dimensionsById = {}
  let sortedDimensionIds = []

  const bySortMethod = {
    default: chart => chart.getPayload().dimensionIds,
    nameAsc: chart => {
      const { dimensionIds } = chart.getPayload()
      return [...dimensionIds].sort((a, b) =>
        getDimensionName(a).localeCompare(getDimensionName(b))
      )
    },
    nameDesc: chart => {
      const { dimensionIds } = chart.getPayload()
      return [...dimensionIds].sort((a, b) =>
        getDimensionName(b).localeCompare(getDimensionName(a))
      )
    },
    valueAsc: chart => {
      const { dimensionIds, result } = chart.getPayload()
      const x = result.data.length - 1

      return [...dimensionIds].sort((a, b) => getDimensionValue(b, x) - getDimensionValue(a, x))
    },
    valueDesc: chart => {
      const { dimensionIds, result } = chart.getPayload()
      const x = result.data.length - 1

      return [...dimensionIds].sort((a, b) => getDimensionValue(a, x) - getDimensionValue(b, x))
    },
  }

  const sortDimensions = () => {
    const dimensionsSort = chart.getAttribute("dimensionsSort")
    const sort = bySortMethod[dimensionsSort]
    sortedDimensionIds = sort(chart)

    chart.trigger("dimensionChanged")
  }

  const updateDimensions = () => {
    const { dimensionIds } = chart.getPayload()

    if (prevDimensionIds !== dimensionIds) {
      prevDimensionIds = dimensionIds
      dimensionsById = dimensionIds.reduce((acc, id, index) => {
        acc[id] = index
        return acc
      }, {})
    }

    sortDimensions()
  }

  const getDimensionIndex = id => dimensionsById[id]

  const getDimensionIds = () => sortedDimensionIds

  const getDimensionColor = id => dimensionColors[dimensionsById[id] % dimensionColors.length]

  const getDimensionName = id => {
    const { dimensionNames } = chart.getPayload()
    return dimensionNames[dimensionsById[id]]
  }

  const getDimensionValue = (id, index) => {
    const { result } = chart.getPayload()
    return result.data[index][dimensionsById[id] + 1]
  }

  chart.onAttributeChange("dimensionsSort", sortDimensions)

  return {
    sortDimensions,
    updateDimensions,
    getDimensionIndex,
    getDimensionIds,
    getDimensionColor,
    getDimensionName,
    getDimensionValue,
  }
}
