import dimensionColors from "./theme/dimensionColors"
import deepEqual, { setsAreEqual } from "../helpers/deepEqual"

export default (chart, sdk) => {
  let prevDimensionIds = []
  let dimensionsById = {}
  let sortedDimensionIds = []
  let visibleDimensionIds = []
  let visibleDimensionSet = new Set()
  let colorCursor = 0
  let colors = []

  const sparklineDimensions = ["sum"]

  const hasSparklineDimension = () => chart.getAttributes().sparkline

  const getPayloadDimensionIds = () => {
    if (hasSparklineDimension()) return sparklineDimensions

    const { viewDimensions } = chart.getMetadata()

    return viewDimensions?.ids || []
  }

  const getSourceDimensionIds = () => [...getPayloadDimensionIds()]

  const bySortMethod = {
    default: (getIds = getSourceDimensionIds) =>
      getIds().sort((a, b) => getDimensionPriority(a) - getDimensionPriority(b)),
    nameAsc: (getIds = getSourceDimensionIds) =>
      getIds().sort((a, b) => getDimensionName(a).localeCompare(getDimensionName(b))),
    nameDesc: (getIds = getSourceDimensionIds) =>
      getIds().sort((a, b) => getDimensionName(b).localeCompare(getDimensionName(a))),
    valueDesc: (getIds = getSourceDimensionIds, x) => {
      const { result } = chart.getPayload()
      x = x || result.data.length - 1

      return getIds().sort((a, b) => getDimensionValue(b, x) - getDimensionValue(a, x))
    },
    valueAsc: (getIds = getSourceDimensionIds, x) => {
      const { result } = chart.getPayload()
      x = x || result.data.length - 1

      return getIds().sort((a, b) => getDimensionValue(a, x) - getDimensionValue(b, x))
    },
    anomalyDesc: (getIds = getSourceDimensionIds, x) => {
      const { result } = chart.getPayload()
      x = x || result.all.length - 1

      return getIds().sort((a, b) => getDimensionValue(b, x, "ar") - getDimensionValue(a, x, "ar"))
    },
    anomalyAsc: (getIds = getSourceDimensionIds, x) => {
      const { result } = chart.getPayload()
      x = x || result.all.length - 1

      return getIds().sort((a, b) => getDimensionValue(a, x, "ar") - getDimensionValue(b, x, "ar"))
    },
  }

  const updateVisibleDimensions = () => {
    const selectedLegendDimensions = chart.getAttribute("selectedLegendDimensions")

    visibleDimensionIds = selectedLegendDimensions.length
      ? sortedDimensionIds.filter(
          id =>
            selectedLegendDimensions.includes(id) ||
            selectedLegendDimensions.includes(getDimensionName(id))
        )
      : sortedDimensionIds

    const prevDimensionSet = visibleDimensionSet
    visibleDimensionSet = new Set(visibleDimensionIds)

    if (!setsAreEqual(visibleDimensionSet, prevDimensionSet))
      chart.trigger("visibleDimensionsChanged")
  }

  const sortDimensions = () => {
    const dimensionsSort = chart.getAttribute("dimensionsSort")
    const sort = bySortMethod[dimensionsSort] || bySortMethod.default
    sortedDimensionIds = sort()
    updateVisibleDimensions()

    if (!sortedDimensionIds) return

    colors = sortedDimensionIds.map(id => selectDimensionColor(id))

    chart.trigger("dimensionChanged")
  }

  const onHoverSortDimensions = (x, dimensionsSort = chart.getAttribute("dimensionsSort")) => {
    const sort = bySortMethod[dimensionsSort] || bySortMethod.default
    return sort(getVisibleDimensionIds, x)
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
    if (deepEqual(prevDimensionIds, dimensionIds)) return

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
    const { colors, groupBy, contextScope, id } = chart.getAttributes()

    if (groupBy.length > 1 || (groupBy.length === 1 && groupBy[0] !== "dimension"))
      return groupBy.join("|")

    if (colors.length) return chart.getAttribute("id")

    return contextScope.join("|") || id
  }

  const selectDimensionColor = id => {
    const key = getMemKey()
    const colors = chart.getAttribute("colors")
    const sparkline = chart.getAttribute("sparkline")
    if (sparkline && colors && colors.length === 1) return colors[0]

    const color = sdk.getRoot().getNextColor(getNextColor, key, id)

    if (typeof color === "string") return color

    const index = chart.getUI().getThemeIndex()
    return color[index]
  }

  const getDimensionColor = id => {
    const key = getMemKey()
    const colors = chart.getAttribute("colors")
    const sparkline = chart.getAttribute("sparkline")
    if (sparkline && colors && colors.length === 1) return colors[0]

    const color = sdk.getRoot().findColor(key, id)

    if (typeof color === "string") return color

    const index = chart.getUI().getThemeIndex()
    return color[index]
  }

  const getColors = () => colors

  const getDimensionName = id => {
    const { viewDimensions } = chart.getMetadata()

    return viewDimensions.names[dimensionsById[id]]
  }

  const getDimensionPriority = id => {
    const { viewDimensions } = chart.getMetadata()

    return viewDimensions.priorities[dimensionsById[id]]
  }

  const getDimensionValue = (id, index, valueKey = "value") => {
    const { result } = chart.getPayload()
    const pointData = result.all[index]

    if (!pointData) return null
    return pointData[dimensionsById[id] + 1][valueKey]
  }

  const toggleDimensionId = (id, { merge = false } = {}) => {
    const selectedLegendDimensions = chart.getAttribute("selectedLegendDimensions")

    if (!selectedLegendDimensions.length) {
      chart.updateAttribute(
        "selectedLegendDimensions",
        merge ? getDimensionIds().filter(d => d !== id) : [id]
      )
      return
    }

    if (isDimensionVisible(id)) {
      const newSelectedLegendDimensions = selectedLegendDimensions.filter(d => d !== id)
      chart.updateAttribute(
        "selectedLegendDimensions",
        newSelectedLegendDimensions.length ? (merge ? newSelectedLegendDimensions : [id]) : []
      )
      return
    }

    const newSelectedLegendDimensions = merge ? [...selectedLegendDimensions, id] : [id]
    chart.updateAttribute("selectedLegendDimensions", newSelectedLegendDimensions)
  }

  chart.onAttributeChange("dimensionsSort", sortDimensions)
  chart.onAttributeChange("selectedLegendDimensions", updateVisibleDimensions)
  chart.on("metadataChanged", () => {
    sortDimensions()
    updateVisibleDimensions()
  })

  const updateMetadataColors = () => {
    let { dimensions } = chart.getMetadata()
    if (!dimensions) return

    const keys = hasSparklineDimension() ? sparklineDimensions : Object.keys(dimensions)
    keys.forEach(selectDimensionColor)
  }

  return {
    sortDimensions,
    updateDimensions,
    updateMetadataColors,
    getDimensionIndex,
    getDimensionIds,
    getVisibleDimensionIds,
    isDimensionVisible,
    toggleDimensionId,
    getColors,
    selectDimensionColor,
    getDimensionColor,
    getDimensionName,
    getDimensionValue,
    onHoverSortDimensions,
    getPayloadDimensionIds,
  }
}
