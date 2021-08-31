import dimensionColors from "./theme/dimensionColors"

export default chart => {
  let prevDimensionIds = []
  let dimensionsById = {}
  let sortedDimensionIds = []
  let visibleDimensionIds = []
  let visibleDimensionSet = new Set()
  let colorsById = {}
  let colorsLength = 0
  let colors = []

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
    valueDesc: x => {
      const { result } = chart.getPayload()
      x = x || result.data.length - 1

      return getSourceDimensionIds().sort(
        (a, b) => getDimensionValue(b, x) - getDimensionValue(a, x)
      )
    },
    valueAsc: x => {
      const { result } = chart.getPayload()
      x = x || result.data.length - 1

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
    visibleDimensionSet = new Set(visibleDimensionIds)
  }

  const sortDimensions = () => {
    const dimensionsSort = chart.getAttribute("dimensionsSort")
    const sort = bySortMethod[dimensionsSort] || bySortMethod.default
    sortedDimensionIds = sort()
    updateVisibleDimensions()

    chart.trigger("dimensionChanged")
  }

  const onHoverSortDimensions = (x, dimensionsSort = chart.getAttribute("dimensionsSort")) => {
    const sort = bySortMethod[dimensionsSort] || bySortMethod.default
    return sort(x)
  }

  const getNextColor = () => {
    const colorsAttribute = chart.getAttribute("colors")
    const index = colorsLength % (colorsAttribute.length + dimensionColors.length)

    if (index < colorsAttribute.length) return colorsAttribute[index]

    return dimensionColors[index - colorsAttribute.length]
  }

  const updateDimensionColor = id => {
    if (id in colorsById) return

    const color = getNextColor()
    colorsById[id] = color
    colorsLength = colorsLength + 1
  }

  const updateDimensionsColor = () => {
    const { dimensionIds } = chart.getPayload()
    colors = dimensionIds.map(id => {
      updateDimensionColor(id)
      return getDimensionColor(id)
    })
  }

  const updateDimensions = () => {
    const { dimensionIds } = chart.getPayload()

    if (prevDimensionIds === dimensionIds) return

    prevDimensionIds = dimensionIds
    dimensionsById = dimensionIds.reduce((acc, id, index) => {
      acc[id] = index
      return acc
    }, {})

    updateDimensionsColor()

    sortDimensions()
  }

  const getDimensionIndex = id => dimensionsById[id]

  const getDimensionIds = () => sortedDimensionIds

  const getVisibleDimensionIds = () => visibleDimensionIds

  const isDimensionVisible = id => visibleDimensionSet.has(id)

  const getDimensionColor = id => {
    const color = colorsById[id]
    if (typeof color === "string") return color

    const index = chart.getUI().getThemeIndex()
    return color[index]
  }

  const getColors = () => colors

  const getDimensionName = id => {
    const { dimensionNames } = chart.getPayload()
    return dimensionNames[dimensionsById[id]]
  }

  const getDimensionValue = (id, index) => {
    const { result } = chart.getPayload()
    return result.data[index][dimensionsById[id] + 1]
  }

  const toggleDimensionId = (id, { merge = false } = {}) => {
    const selectedDimensions = chart.getAttribute("selectedDimensions")

    if (!selectedDimensions) {
      chart.updateAttribute("selectedDimensions", [id])
      return
    }

    if (isDimensionVisible(id)) {
      const newSelectedDimensions = selectedDimensions.filter(d => d !== id)
      chart.updateAttribute(
        "selectedDimensions",
        newSelectedDimensions.length ? newSelectedDimensions : null
      )
      return
    }

    const newSelectedDimensions = merge ? [...selectedDimensions, id] : [id]
    chart.updateAttribute("selectedDimensions", newSelectedDimensions)
  }

  chart.onAttributeChange("dimensionsSort", sortDimensions)
  chart.onAttributeChange("selectedDimensions", updateVisibleDimensions)

  return {
    sortDimensions,
    updateDimensions,
    getDimensionIndex,
    getDimensionIds,
    getVisibleDimensionIds,
    isDimensionVisible,
    toggleDimensionId,
    getColors,
    getDimensionColor,
    getDimensionName,
    getDimensionValue,
    onHoverSortDimensions,
  }
}
