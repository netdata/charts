import dimensionColors from "./theme/dimensionColors"

export default chart => {
  let prevDimensionIds = []
  let dimensionsById = {}
  let sortedDimensionIds = []
  let visibleDimensionIds = []

  const getSourceDimensionIds = () => {
    const { dimensionIds } = chart.getPayload()
    return [...dimensionIds]
  }

  const bySortMethod = {
    default: () => chart.getPayload().dimensionIds,
    nameAsc: () =>
      getSourceDimensionIds().sort((a, b) =>
        getDimensionName(a).localeCompare(getDimensionName(b))
      ),
    nameDesc: () =>
      getSourceDimensionIds().sort((a, b) =>
        getDimensionName(b).localeCompare(getDimensionName(a))
      ),
    valueAsc: () => {
      const { result } = chart.getPayload()
      const x = result.data.length - 1

      return getSourceDimensionIds().sort(
        (a, b) => getDimensionValue(b, x) - getDimensionValue(a, x)
      )
    },
    valueDesc: () => {
      const { result } = chart.getPayload()
      const x = result.data.length - 1

      return getSourceDimensionIds().sort(
        (a, b) => getDimensionValue(a, x) - getDimensionValue(b, x)
      )
    },
  }

  const updateVisibleDimensions = () => {
    const selectedDimensions = chart.getAttribute("selectedDimensions")
    visibleDimensionIds = selectedDimensions
      ? sortedDimensionIds.filter(id => selectedDimensions.includes(id))
      : sortedDimensionIds
  }

  const sortDimensions = () => {
    const dimensionsSort = chart.getAttribute("dimensionsSort")
    const sort = bySortMethod[dimensionsSort]
    sortedDimensionIds = sort()
    updateVisibleDimensions()

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

  const getVisibleDimensionIds = () => visibleDimensionIds

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
  chart.onAttributeChange("selectedDimensions", updateVisibleDimensions)

  return {
    sortDimensions,
    updateDimensions,
    getDimensionIndex,
    getDimensionIds,
    getVisibleDimensionIds,
    getDimensionColor,
    getDimensionName,
    getDimensionValue,
  }
}
