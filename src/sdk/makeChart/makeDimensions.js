import dimensionColors from "./theme/dimensionColors"
import deepEqual, { setsAreEqual } from "@/helpers/deepEqual"
import { heatmapTypes, isHeatmap, isIncremental, withoutPrefix } from "@/helpers/heatmap"

const noop = () => {}

export default (chart, sdk) => {
  let prevDimensionIds = []
  let dimensionsById = {}
  let sortedDimensionIds = []
  let visibleDimensionIds = []
  let visibleDimensionIndexesById = {}
  let visibleDimensionSet = new Set()
  let colorCursor = 0

  const sparklineDimensions = ["sum"]

  chart.isSparkline = () => chart.getAttribute("sparkline")
  chart.getHeatmapType = () => chart.getAttribute("heatmapType")

  chart.getPayloadDimensionIds = () => {
    if (chart.isSparkline()) return sparklineDimensions

    const viewDimensions = chart.getAttribute("viewDimensions")

    return [...(viewDimensions?.ids || [])]
  }

  const withSortByNameFallback =
    (cb = noop) =>
    (a, b) =>
      cb(a, b) ||
      chart.getDimensionName(a).localeCompare(chart.getDimensionName(b), undefined, {
        sensitivity: "accent",
        ignorePunctuation: true,
      })

  const bySortMethod = {
    default: (getIds = chart.getPayloadDimensionIds) =>
      getIds().sort(
        withSortByNameFallback(
          (a, b) => chart.getDimensionPriority(a) - chart.getDimensionPriority(b)
        )
      ),
    nameAsc: (getIds = chart.getPayloadDimensionIds) => getIds().sort(withSortByNameFallback()),
    nameDesc: (getIds = chart.getPayloadDimensionIds) =>
      getIds().sort((a, b) => chart.getDimensionName(b).localeCompare(chart.getDimensionName(a))),
    valueDesc: (getIds = chart.getPayloadDimensionIds, x) => {
      const { data } = chart.getPayload()
      x = x || data.length - 1

      return getIds().sort(
        withSortByNameFallback(
          (a, b) => chart.getDimensionValue(b, x) - chart.getDimensionValue(a, x)
        )
      )
    },
    valueAsc: (getIds = chart.getPayloadDimensionIds, x) => {
      const { data } = chart.getPayload()
      x = x || data.length - 1

      return getIds().sort(
        withSortByNameFallback(
          (a, b) => chart.getDimensionValue(a, x) - chart.getDimensionValue(b, x)
        )
      )
    },
    anomalyDesc: (getIds = chart.getPayloadDimensionIds, x) => {
      const { all } = chart.getPayload()
      x = x || all.length - 1

      return getIds().sort(
        withSortByNameFallback(
          (a, b) =>
            chart.getDimensionValue(b, x, { valueKey: "arp" }) -
            chart.getDimensionValue(a, x, { valueKey: "arp" })
        )
      )
    },
    anomalyAsc: (getIds = chart.getPayloadDimensionIds, x) => {
      const { all } = chart.getPayload()
      x = x || all.length - 1

      return getIds().sort(
        withSortByNameFallback(
          (a, b) =>
            chart.getDimensionValue(a, x, { valueKey: "arp" }) -
            chart.getDimensionValue(b, x, { valueKey: "arp" })
        )
      )
    },
    annotationsDesc: (getIds = chart.getPayloadDimensionIds, x) => {
      const { all } = chart.getPayload()
      x = x || all.length - 1

      return getIds().sort(
        withSortByNameFallback(
          (a, b) =>
            chart.getDimensionValue(b, x, { valueKey: "pa" }) -
            chart.getDimensionValue(a, x, { valueKey: "pa" })
        )
      )
    },
    annotationsAsc: (getIds = chart.getPayloadDimensionIds, x) => {
      const { all } = chart.getPayload()
      x = x || all.length - 1

      return getIds().sort(
        withSortByNameFallback(
          (a, b) =>
            chart.getDimensionValue(a, x, { valueKey: "pa" }) -
            chart.getDimensionValue(b, x, { valueKey: "pa" })
        )
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

    visibleDimensionIndexesById = visibleDimensionIds.reduce((h, id, i) => {
      h[id] = i
      return h
    }, {})

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
    const sort = isHeatmap(chart)
      ? bySortMethod.default
      : bySortMethod[dimensionsSort] || bySortMethod.default
    return sort(() => [...chart.getVisibleDimensionIds()], x)
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

    const groupedByDimension =
      chart.getAttribute("groupBy").length === 1 && chart.getAttribute("groupBy")[0] === "dimension"

    let prefix = null

    dimensionsById = dimensionIds.reduce((acc, id, index) => {
      if (groupedByDimension && !chart.getHeatmapType()) {
        const newPrefix = id.match(/(.+)_(\d+?\.?(\d+)?|\+[Ii]nf)$/)?.[1]
        chart.setAttribute(
          "heatmapType",
          (prefix && newPrefix !== prefix) || !newPrefix ? heatmapTypes.disabled : null
        )

        if (prefix === newPrefix)
          chart.setAttribute("heatmapType", heatmapTypes[prefix] || heatmapTypes.incremental)

        prefix = newPrefix
      }

      acc[id] = index

      return acc
    }, {})

    if (!groupedByDimension) chart.setAttribute("heatmapType", null)
    else if (/latency/.test(chart.getAttribute("context")))
      chart.setAttribute("heatmapType", heatmapTypes.default)

    chart.sortDimensions()
    chart.updateColors()
  }

  chart.getDimensionIndex = id => dimensionsById[id]

  chart.getDimensionIds = () => sortedDimensionIds

  chart.getVisibleDimensionIds = () => visibleDimensionIds

  chart.getVisibleDimensionIndexesById = () => visibleDimensionIndexesById

  chart.isDimensionVisible = id => visibleDimensionSet.has(id)

  let memKey = null
  const getMemKey = () => {
    if (memKey) return memKey
    const { colors, contextScope, id } = chart.getAttributes()

    memKey = colors.length ? chart.getAttribute("id") : (contextScope[0] || id).split(".")[0]
    return memKey
  }

  chart.selectDimensionColor = (id = "selected") => {
    const key = getMemKey()
    const colorsAttr = chart.getAttribute("colors")
    const sparkline = chart.isSparkline()
    if (sparkline && colorsAttr && colorsAttr.length === 1) return colorsAttr[0]

    const isSelected = id === "selected"
    id = !id || isSelected ? chart.getAttribute("selectedDimensions")[0] : id

    const color =
      isSelected && colorsAttr?.length
        ? colorsAttr[0]
        : sdk.getRoot().getNextColor(getNextColor, key, id)

    const index = chart.getThemeIndex()
    return typeof color === "string" ? color : color[index]
  }

  chart.getDimensionName = id => {
    const viewDimensions = chart.getAttribute("viewDimensions")

    if (!viewDimensions?.names) return ""

    if (isHeatmap(chart)) return withoutPrefix(viewDimensions.names[dimensionsById[id]])

    return viewDimensions.names[dimensionsById[id]]
  }

  chart.getDimensionPriority = id => {
    const viewDimensions = chart.getAttribute("viewDimensions")

    if (!viewDimensions?.priorities) return 0

    return viewDimensions.priorities[dimensionsById[id]]
  }

  chart.getRowDimensionValue = (
    id,
    pointData,
    { valueKey = "value", abs = true, incrementable = true, allowNull = false } = {}
  ) => {
    let value = pointData?.[dimensionsById[id] + 1]
    if (typeof value === "undefined") return null

    value = value !== null && typeof value === "object" ? value[valueKey] : value
    value = allowNull && value === null ? value : abs ? Math.abs(value) : value

    if (incrementable && isIncremental(chart)) {
      const index = chart.getVisibleDimensionIndexesById()[id]
      const prevId = chart.getVisibleDimensionIds()[index - 1]

      value =
        value -
        (chart.getRowDimensionValue(prevId, pointData, {
          valueKey,
          abs,
          incrementable: false,
          allowNull,
        }) || 0)
    }

    return value
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
    if (!dimensionIds.length) return

    const keys = chart.isSparkline() ? sparklineDimensions : dimensionIds

    keys.forEach(chart.selectDimensionColor)
  }
}
