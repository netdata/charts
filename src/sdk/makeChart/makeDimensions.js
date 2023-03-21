import dimensionColors from "./theme/dimensionColors"
import deepEqual, { setsAreEqual } from "@//helpers/deepEqual"

export default (chart, sdk) => {
  let prevDimensionIds = []
  let dimensionsById = {}
  let sortedDimensionIds = []
  let visibleDimensionIds = []
  let visibleDimensionSet = new Set()
  let colorCursor = 0

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
    annotationsDesc: (getIds = getSourceDimensionIds, x) => {
      const { result } = chart.getPayload()
      x = x || result.all.length - 1

      return getIds().sort((a, b) => getDimensionValue(b, x, "pa") - getDimensionValue(a, x, "pa"))
    },
    annotationsAsc: (getIds = getSourceDimensionIds, x) => {
      const { result } = chart.getPayload()
      x = x || result.all.length - 1

      return getIds().sort((a, b) => getDimensionValue(a, x, "pa") - getDimensionValue(b, x, "pa"))
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
    const { colors, contextScope, id } = chart.getAttributes()

    if (colors.length) return chart.getAttribute("id")

    return contextScope.join("|") || id
  }

  const selectDimensionColor = id => {
    const key = getMemKey()
    const colorsAttr = chart.getAttribute("colors")
    const sparkline = chart.getAttribute("sparkline")
    if (sparkline && colorsAttr && colorsAttr.length === 1) return colorsAttr[0]

    id = !id || id === "selected" ? chart.getAttribute("selectedDimensions")[0] : id

    const color = sdk.getRoot().getNextColor(getNextColor, key, id)

    if (typeof color === "string") return color

    const index = chart.getUI().getThemeIndex()
    return color[index]
  }

  const getDimensionName = id => {
    const { viewDimensions } = chart.getMetadata()

    return viewDimensions.names[dimensionsById[id]]
  }

  const getDimensionPriority = id => {
    const { viewDimensions } = chart.getMetadata()

    return viewDimensions.priorities[dimensionsById[id]]
  }

  const getRowDimensionValue = (id, pointData, valueKey = "value") => {
    if (typeof pointData?.[dimensionsById[id] + 1] === "undefined") return null

    const value = pointData[dimensionsById[id] + 1]
    return value !== null && typeof value === "object" ? value[valueKey] : value
  }

  const getDimensionValue = (id, index, valueKey) => {
    const { result } = chart.getPayload()
    const pointData = result.all[index]

    return getRowDimensionValue(id, pointData, valueKey)
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
    let { dimensionIds } = chart.getMetadata()
    if (!Object.keys(dimensionIds)?.length) return

    const keys = hasSparklineDimension() ? sparklineDimensions : dimensionIds

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
    selectDimensionColor,
    getDimensionName,
    getRowDimensionValue,
    getDimensionValue,
    onHoverSortDimensions,
    getPayloadDimensionIds,
  }
}
