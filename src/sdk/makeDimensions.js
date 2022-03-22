import dimensionColors from "./theme/dimensionColors"

export default chart => {
  let prevDimensionIds = []
  let dimensionsById = {}
  let sortedDimensionIds = []
  let visibleDimensionIds = []
  let visibleDimensionSet = new Set()
  let colorCursor = 0
  let colors = []

  const sparklineDimensions = ["sum"]

  const hasSparklineDimension = () => {
    const { composite, sparkline } = chart.getAttributes()
    return !composite && sparkline
  }

  const getPayloadDimensionIds = () => {
    if (hasSparklineDimension()) return sparklineDimensions

    const { dimensionIds } = chart.getPayload()
    return dimensionIds
  }

  const getSourceDimensionIds = () => [...getPayloadDimensionIds()]

  const bySortMethod = {
    default: () => getPayloadDimensionIds(),
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
      ? sortedDimensionIds.filter(
          id => selectedDimensions.includes(id) || selectedDimensions.includes(getDimensionName(id))
        )
      : sortedDimensionIds
    visibleDimensionSet = new Set(visibleDimensionIds)
  }

  const sortDimensions = () => {
    const dimensionsSort = chart.getAttribute("dimensionsSort")
    const sort = bySortMethod[dimensionsSort] || bySortMethod.default
    sortedDimensionIds = sort()
    updateVisibleDimensions()

    colors = sortedDimensionIds.map(id => getDimensionColor(id))

    chart.trigger("dimensionChanged")
  }

  const onHoverSortDimensions = (x, dimensionsSort = chart.getAttribute("dimensionsSort")) => {
    const sort = bySortMethod[dimensionsSort] || bySortMethod.default
    return sort(x)
  }

  const getNextColor = () => {
    const colorsAttribute = chart.getAttribute("colors")
    const index = colorCursor++ % (colorsAttribute.length + dimensionColors.length)

    const nextColor =
      index < colorsAttribute.length
        ? typeof colorsAttribute[index] === "number"
          ? dimensionColors[colorsAttribute[index]]
          : colorsAttribute[index]
        : dimensionColors[index - colorsAttribute.length]

    return nextColor
  }

  const updateDimensions = () => {
    const dimensionIds = getPayloadDimensionIds()

    sortDimensions()
    if (prevDimensionIds === dimensionIds) return

    prevDimensionIds = dimensionIds
    dimensionsById = dimensionIds.reduce((acc, id, index) => {
      acc[id] = index
      return acc
    }, {})

    sortDimensions()
  }

  const getDimensionIndex = id => dimensionsById[id]

  const getDimensionIds = () => sortedDimensionIds

  const getVisibleDimensionIds = () => visibleDimensionIds

  const isDimensionVisible = id => visibleDimensionSet.has(id)

  const getMemKey = () => {
    const colors = chart.getAttribute("colors")
    const { context } = chart.getMetadata()
    const groupBy = chart.getAttribute("groupBy")

    if (groupBy !== "dimension") return groupBy

    if (colors.length) return chart.getAttribute("id")

    return context
  }

  const getDimensionColor = id => {
    const key = getMemKey()
    const color = chart.getParent().getNextColor(getNextColor, key, id)

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
    const pointData = result.data[index]

    if (!pointData) return null
    return pointData[dimensionsById[id] + 1]
  }

  const toggleDimensionId = (id, { merge = false } = {}) => {
    const selectedDimensions = chart.getAttribute("selectedDimensions")
    if (!selectedDimensions) {
      chart.updateAttribute(
        "selectedDimensions",
        merge ? getDimensionIds().filter(d => d !== id) : [id]
      )
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
