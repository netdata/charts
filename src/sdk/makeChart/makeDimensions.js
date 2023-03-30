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

  chart.hasSparklineDimension = () => chart.getAttribute("sparkline")

  chart.getPayloadDimensionIds = () => {
    if (chart.hasSparklineDimension()) return sparklineDimensions

    const viewDimensions = chart.getAttribute("viewDimensions")

    return (viewDimensions?.ids || []).sort(
      (a, b) => chart.getDimensionPriority(a) - chart.getDimensionPriority(b)
    )
  }

  chart.getSourceDimensionIds = () => [...chart.getPayloadDimensionIds()]

  const bySortMethod = {
    default: (getIds = chart.getSourceDimensionIds) =>
      getIds().sort((a, b) => chart.getDimensionPriority(a) - chart.getDimensionPriority(b)),
    nameAsc: (getIds = chart.getSourceDimensionIds) =>
      getIds().sort((a, b) => chart.getDimensionName(a).localeCompare(chart.getDimensionName(b))),
    nameDesc: (getIds = chart.getSourceDimensionIds) =>
      getIds().sort((a, b) => chart.getDimensionName(b).localeCompare(chart.getDimensionName(a))),
    valueDesc: (getIds = chart.getSourceDimensionIds, x) => {
      const { data } = chart.getPayload()
      x = x || data.length - 1

      return getIds().sort((a, b) => chart.getDimensionValue(b, x) - chart.getDimensionValue(a, x))
    },
    valueAsc: (getIds = chart.getSourceDimensionIds, x) => {
      const { data } = chart.getPayload()
      x = x || data.length - 1

      return getIds().sort((a, b) => chart.getDimensionValue(a, x) - chart.getDimensionValue(b, x))
    },
    anomalyDesc: (getIds = chart.getSourceDimensionIds, x) => {
      const { all } = chart.getPayload()
      x = x || all.length - 1

      return getIds().sort(
        (a, b) =>
          chart.getDimensionValue(b, x, { valueKey: "arp" }) -
          chart.getDimensionValue(a, x, { valueKey: "arp" })
      )
    },
    anomalyAsc: (getIds = chart.getSourceDimensionIds, x) => {
      const { all } = chart.getPayload()
      x = x || all.length - 1

      return getIds().sort(
        (a, b) =>
          chart.getDimensionValue(a, x, { valueKey: "arp" }) -
          chart.getDimensionValue(b, x, { valueKey: "arp" })
      )
    },
    annotationsDesc: (getIds = chart.getSourceDimensionIds, x) => {
      const { all } = chart.getPayload()
      x = x || all.length - 1

      return getIds().sort(
        (a, b) =>
          chart.getDimensionValue(b, x, { valueKey: "pa" }) -
          chart.getDimensionValue(a, x, { valueKey: "pa" })
      )
    },
    annotationsAsc: (getIds = chart.getSourceDimensionIds, x) => {
      const { all } = chart.getPayload()
      x = x || all.length - 1

      return getIds().sort(
        (a, b) =>
          chart.getDimensionValue(a, x, { valueKey: "pa" }) -
          chart.getDimensionValue(b, x, { valueKey: "pa" })
      )
    },
  }

  const updateVisibleDimensions = () => {
    const selectedLegendDimensions = chart.getAttribute("selectedLegendDimensions")

    visibleDimensionIds = selectedLegendDimensions.length
      ? sortedDimensionIds.filter(
          id =>
            selectedLegendDimensions.includes(id) ||
            selectedLegendDimensions.includes(chart.getDimensionName(id))
        )
      : sortedDimensionIds

    const prevDimensionSet = visibleDimensionSet
    visibleDimensionSet = new Set(visibleDimensionIds)

    if (!setsAreEqual(visibleDimensionSet, prevDimensionSet))
      chart.trigger("visibleDimensionsChanged")
  }

  chart.sortDimensions = () => {
    const dimensionsSort = chart.getAttribute("dimensionsSort")
    const sort = bySortMethod[dimensionsSort] || bySortMethod.default
    sortedDimensionIds = sort()
    updateVisibleDimensions()

    if (!sortedDimensionIds) return

    chart.trigger("dimensionChanged")
  }

  chart.onHoverSortDimensions = (x, dimensionsSort = chart.getAttribute("dimensionsSort")) => {
    const sort = bySortMethod[dimensionsSort] || bySortMethod.default
    return sort(chart.getVisibleDimensionIds, x)
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

  chart.updateDimensions = () => {
    const dimensionIds = chart.getPayloadDimensionIds()

    if (deepEqual(prevDimensionIds, dimensionIds)) return

    prevDimensionIds = dimensionIds
    dimensionsById = dimensionIds.reduce((acc, id, index) => {
      acc[id] = index
      return acc
    }, {})

    chart.sortDimensions()
    chart.updateColors()
  }

  chart.getDimensionIndex = id => dimensionsById[id]

  chart.getDimensionIds = () => sortedDimensionIds

  chart.getVisibleDimensionIds = () => visibleDimensionIds

  chart.isDimensionVisible = id => visibleDimensionSet.has(id)

  const getMemKey = () => {
    const { colors, contextScope, id } = chart.getAttributes()

    if (colors.length) return chart.getAttribute("id")

    return contextScope.join("|") || id
  }

  chart.selectDimensionColor = id => {
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

  chart.getDimensionName = id => {
    const viewDimensions = chart.getAttribute("viewDimensions")

    return viewDimensions.names[dimensionsById[id]]
  }

  chart.getDimensionPriority = id => {
    const viewDimensions = chart.getAttribute("viewDimensions")

    return viewDimensions.priorities[dimensionsById[id]]
  }

  chart.getRowDimensionValue = (id, pointData, { valueKey = "value", objKey, abs = true } = {}) => {
    if (objKey) pointData = pointData[objKey]

    let value = pointData?.[dimensionsById[id] + 1]
    if (typeof value === "undefined") return null

    value = value !== null && typeof value === "object" ? value[valueKey] : value

    return abs ? Math.abs(value) : value
  }

  chart.getDimensionValue = (id, index, options = {}) => {
    const { all } = chart.getPayload()
    const pointData = all[index]

    return chart.getRowDimensionValue(id, pointData, options)
  }

  chart.toggleDimensionId = (id, { merge = false } = {}) => {
    const selectedLegendDimensions = chart.getAttribute("selectedLegendDimensions")

    if (!selectedLegendDimensions.length) {
      chart.updateAttribute(
        "selectedLegendDimensions",
        merge ? chart.getDimensionIds().filter(d => d !== id) : [id]
      )
      return
    }

    if (chart.isDimensionVisible(id)) {
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

  chart.onAttributeChange("dimensionsSort", chart.sortDimensions)
  chart.onAttributeChange("selectedLegendDimensions", updateVisibleDimensions)

  chart.updateColors = () => {
    let dimensionIds = chart.getAttribute("dimensionIds")
    if (!Object.keys(dimensionIds)?.length) return

    const keys = chart.hasSparklineDimension() ? sparklineDimensions : dimensionIds

    keys.forEach(chart.selectDimensionColor)
  }
}
