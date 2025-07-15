import dimensionColors from "./theme/dimensionColors"
import deepEqual, { setsAreEqual } from "@/helpers/deepEqual"
import { heatmapTypes, isHeatmap, isIncremental, withoutPrefix } from "@/helpers/heatmap"

const noop = () => {}

export default (chart, sdk) => {
  let prevDimensionIds = []
  let dimensionsById = {}
  let sortedDimensionIds = []
  let visibleDimensionIds = []
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
    (cb = noop, fallbackCb = noop) =>
    (a, b) =>
      cb(a, b) ||
      fallbackCb(a, b) ||
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
            chart.getDimensionValue(a, x, { valueKey: "arp" }),
          (a, b) => chart.getDimensionValue(b, x) - chart.getDimensionValue(a, x)
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
            chart.getDimensionValue(b, x, { valueKey: "arp" }),
          (a, b) => chart.getDimensionValue(a, x) - chart.getDimensionValue(b, x)
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
            chart.getDimensionValue(a, x, { valueKey: "pa" }),
          (a, b) => chart.getDimensionValue(b, x) - chart.getDimensionValue(a, x)
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
            chart.getDimensionValue(b, x, { valueKey: "pa" }),
          (a, b) => chart.getDimensionValue(a, x) - chart.getDimensionValue(b, x)
        )
      )
    },
  }

  const alwaysSort = {
    valueDesc: true,
    valueAsc: true,
    anomalyDesc: true,
    anomalyAsc: true,
    annotationsDesc: true,
    annotationsAsc: true,
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
    const sort = isHeatmap(chart)
      ? bySortMethod.default
      : bySortMethod[dimensionsSort] || bySortMethod.default
    return sort(() => [...chart.getVisibleDimensionIds()], x)
  }

  const getNextColor = () => {
    const colorsAttribute = chart.getAttribute("colors", [])
    const index = colorCursor++ % (colorsAttribute.length + dimensionColors.length)

    const nextColor =
      index < colorsAttribute.length
        ? typeof colorsAttribute[index] === "number"
          ? dimensionColors[colorsAttribute[index]]
          : !colorsAttribute[index]
            ? dimensionColors[colorCursor % dimensionColors.length]
            : colorsAttribute[index]
        : dimensionColors[index - colorsAttribute.length]

    return nextColor
  }

  chart.updateDimensions = () => {
    const dimensionIds = chart.getPayloadDimensionIds()

    if (deepEqual(prevDimensionIds, dimensionIds)) {
      if (alwaysSort[chart.getAttribute("dimensionsSort")]) chart.sortDimensions()
      return
    }

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

  chart.isDimensionVisible = id => visibleDimensionSet.has(id)

  let memKey = null
  const getMemKey = () => {
    if (memKey) return memKey
    const { colors, contextScope, id } = chart.getAttributes()

    const keySource = String(id || (contextScope && contextScope[0]) || "default")
    memKey = colors.length ? chart.getAttribute("id") : keySource.split(/[._]/)[0]
    return memKey
  }

  chart.selectDimensionColor = (id = "selected", partIndex) => {
    const key = getMemKey()
    const colorsAttr = chart.getAttribute("colors")
    const sparkline = chart.isSparkline()
    if (sparkline && Array.isArray(colorsAttr)) return colorsAttr[0]

    const isSelected = id === "selected"
    id = !id || isSelected ? chart.getAttribute("selectedDimensions")[0] || id : id

    if (!isNaN(partIndex)) id = id.split(",")?.[partIndex] || id

    const color =
      isSelected && colorsAttr?.length
        ? colorsAttr[0]
        : sdk.getRoot().getNextColor(getNextColor, key, id)

    const index = chart.getThemeIndex()
    return typeof color === "string" ? color : color[index]
  }

  chart.getDimensionName = (id, partIndex) => {
    const viewDimensions = chart.getAttribute("viewDimensions")

    if (!viewDimensions?.names) return ""

    let dimName = viewDimensions.names[dimensionsById[id]] || id

    if (!isNaN(partIndex)) dimName = dimName.split(",")?.[partIndex] ?? dimName

    if (isHeatmap(chart)) return withoutPrefix(dimName)

    return dimName
  }

  chart.getDimensionPriority = id => {
    const viewDimensions = chart.getAttribute("viewDimensions")

    if (!viewDimensions?.priorities) return 0

    return viewDimensions.priorities[dimensionsById[id]]
  }

  chart.getDimensionUnit = id => {
    const viewDimensions = chart.getAttribute("viewDimensions")
    if (!viewDimensions?.units) return ""

    if (!id) return viewDimensions.units[0]

    return viewDimensions.units[dimensionsById[id]] || viewDimensions.units[0]
  }

  chart.getDimensionContext = id => {
    const viewDimensions = chart.getAttribute("viewDimensions")

    if (!viewDimensions?.contexts) return ""

    return viewDimensions.contexts[dimensionsById[id]] || viewDimensions.contexts[0]
  }

  chart.getUnitAttributes = (id, key = "units") => {
    const context = chart.getDimensionContext(id)

    if (context) {
      if (chart.getAttribute(`${key}ByContext`)[context]) {
        return chart.getAttribute(`${key}ByContext`)[context]
      }
    }

    const baseUnit = chart.getDimensionUnit(id)
    let unitIndex = chart.getAttribute(key).findIndex(u => u === baseUnit)
    unitIndex = unitIndex === -1 ? 0 : unitIndex

    const base = chart.getAttribute(`${key}ConversionBase`)[unitIndex]
    const prefix = chart.getAttribute(`${key}ConversionPrefix`)[unitIndex]
    const method = chart.getAttribute(`${key}ConversionMethod`)[unitIndex]
    const fractionDigits = chart.getAttribute(`${key}ConversionFractionDigits`)[unitIndex]
    const divider = chart.getAttribute(`${key}ConversionDivider`)[unitIndex]
    const unit = chart.getAttribute(key)[unitIndex]

    return { method, fractionDigits, base, prefix, divider, unit }
  }

  chart.getDimensionGroups = () => {
    const viewDimensions = chart.getAttribute("viewDimensions")

    if (!viewDimensions?.grouped?.length) return []

    return viewDimensions.grouped
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
      let index = chart.getDimensionIds().findIndex(dimId => dimId === id)

      if (index === -1) return value

      let prevId = chart.getDimensionIds()[index - 1]
      while (prevId && !chart.isDimensionVisible(prevId))
        prevId = chart.getDimensionIds()[--index - 1]

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

    keys.forEach(id => chart.selectDimensionColor(id))
  }
}
