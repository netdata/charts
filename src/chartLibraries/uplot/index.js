import uPlot from "uplot"
import { debounce } from "throttle-debounce"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import { makeGetColor, withoutPrefix } from "@/helpers/heatmap"
import { formatHeatmapLabel } from "@/helpers/heatmapScale"
import { getStackBounds, getStackSegments, getStackValueRange } from "./stacking"
import { stack } from "./bars/stack"
import makeOverlays from "./overlays"
import makeAnomaly from "./plotters/anomaly"
import makeAnnotations from "./plotters/annotations"
import makeGetHoverDimension from "./hover"

const barGroupWidth = 0.6

const doubleTapDelay = 300
const minDragPx = 5

const axisFont = "11px 'IBM Plex Sans', sans-serif"
const tickSize = 4
const axisGap = 6
const xTickSpace = 80
const heatmapPixelsPerLabel = 15

const lineWidth = 2
const areaLineWidth = 1.5
const areaGradientTopAlpha = "59"
const areaGradientBottomAlpha = "00"
const stackedFillAlpha = "CC"
const stackedEdgeAlpha = "E6"

const yRangePadPx = 15
const yRangePadFallbackRatio = 0.05

const hiddenAxisSize = 0

const steppedPathBuilder = uPlot.paths.stepped && uPlot.paths.stepped({ align: 1 })
const nullPathBuilder = () => null

const makeAreaFill = color => self => {
  const { ctx, bbox } = self
  const gradient = ctx.createLinearGradient(0, bbox.top, 0, bbox.top + bbox.height)
  gradient.addColorStop(0, `${color}${areaGradientTopAlpha}`)
  gradient.addColorStop(1, `${color}${areaGradientBottomAlpha}`)
  return gradient
}

const makeSolidFill = color => () => color

const padYRange = (self, min, max) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [min, max]

  const span = max - min
  if (span <= 0) return [min, max]

  const height = self && self.bbox ? self.bbox.height / (self.pxRatio || 1) : 0
  const ratio = height > 0 ? yRangePadPx / height : yRangePadFallbackRatio
  const pad = span * ratio

  return [min - pad, max + pad]
}

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let u = null
  let element = null
  let listeners
  let resizeObserver
  let hovering = false
  let detachNavigation = null
  let overlays = null
  let xRangeOverride = null
  let selectEnded = false
  let prevYMin
  let prevYMax

  const getData = () => {
    const { data } = chart.getPayload()
    const dimensionIds = chart.getPayloadDimensionIds()

    if (chart.getAttribute("outOfLimits") || !data?.length || !dimensionIds.length) return null

    const rows = data.length
    const x = new Array(rows)
    const series = dimensionIds.map(() => new Array(rows))

    for (let r = 0; r < rows; r++) {
      const row = data[r]
      x[r] = row[0] / 1000

      for (let d = 0; d < dimensionIds.length; d++) {
        const value = row[d + 1]
        series[d][r] = value == null ? null : value
      }
    }

    return [x, ...series]
  }

  const stackBounds = () =>
    getStackBounds(chart.getPayload().data, chart.getPayloadDimensionIds(), id =>
      chart.isDimensionVisible(id)
    )

  const isBarType = chartType => chartType === "multiBar" || chartType === "stackedBar"

  const getPaths = () => {
    const chartType = chart.getAttribute("chartType")
    if (chartType === "stacked" || chartType === "heatmap" || isBarType(chartType))
      return nullPathBuilder
    if (chart.getAttribute("stepPlot")) return steppedPathBuilder

    return undefined
  }

  const getSeries = () => {
    const chartType = chart.getAttribute("chartType")
    const sparkline = chart.isSparkline()
    const filled = chartType === "area"
    const heatmap = chartType === "heatmap"
    const bar = isBarType(chartType)
    const paths = getPaths()

    return [
      {},
      ...chart.getPayloadDimensionIds().map(id => {
        const color = chart.selectDimensionColor(id)

        if (sparkline)
          return {
            label: id,
            show: chart.isDimensionVisible(id),
            stroke: color,
            width: 0,
            fill: makeSolidFill(color),
            points: { show: false },
            ...(paths && { paths }),
          }

        return {
          label: id,
          show: chart.isDimensionVisible(id),
          stroke: color,
          width: filled ? areaLineWidth : lineWidth,
          ...(paths && { paths }),
          ...(filled && { fill: makeAreaFill(color) }),
          ...((heatmap || bar) && { points: { show: false } }),
        }
      }),
    ]
  }

  const getHeatmapValueRange = () => {
    const staticValueRange = chart.getAttribute("staticValueRange")
    if (staticValueRange) return [Math.ceil(staticValueRange[0]), Math.ceil(staticValueRange[1])]

    return [0, chart.getVisibleHeatmapIds().length || 1]
  }

  const padAwayFromZero = value => (value === 0 ? 0 : value * 1.05)

  const getBarValueRange = (self, chartType, dataMin, dataMax) => {
    const staticValueRange = chart.getAttribute("staticValueRange")
    if (staticValueRange) return staticValueRange

    if (chartType === "stackedBar") {
      const dimensionIds = chart.getPayloadDimensionIds()
      const omit = index => !chart.isDimensionVisible(dimensionIds[index - 1])
      const { data } = stack(self.data, omit)

      let min = 0
      let max = 0

      for (let i = 1; i < data.length; i++) {
        if (omit(i)) continue

        const column = data[i]
        for (let row = 0; row < column.length; row++) {
          const value = column[row]
          if (value == null) continue
          if (value < min) min = value
          if (value > max) max = value
        }
      }

      return [padAwayFromZero(min), padAwayFromZero(max)]
    }

    return [padAwayFromZero(Math.min(0, dataMin)), padAwayFromZero(Math.max(0, dataMax))]
  }

  const areaIncludesZero = () => {
    if (chart.getAttribute("includeZero")) return true

    const dimensionIds = chart.getPayloadDimensionIds()
    const selectedLegendDimensions = chart.getAttribute("selectedLegendDimensions")
    return dimensionIds.length > 1 && selectedLegendDimensions.length > 1
  }

  const getScales = () => ({
    x: {
      time: true,
      range: () => {
        if (xRangeOverride) return xRangeOverride
        const [after, before] = chart.getDateWindow()
        return [after / 1000, before / 1000]
      },
    },
    y: {
      range: (self, dataMin, dataMax) => {
        const chartType = chart.getAttribute("chartType")
        if (chartType === "stacked") return getStackValueRange(stackBounds())
        if (chartType === "heatmap") return getHeatmapValueRange()
        if (isBarType(chartType)) return getBarValueRange(self, chartType, dataMin, dataMax)

        const [rangeMin, rangeMax] = chart.getAttribute("getValueRange")(chart)
        let min = rangeMin == null ? dataMin : rangeMin
        let max = rangeMax == null ? dataMax : rangeMax

        if (chartType === "area" && areaIncludesZero()) {
          min = Math.min(0, min)
          max = Math.max(0, max)
        }

        return padYRange(self, min, max)
      },
    },
  })

  const getHeatmapYAxis = (gridColor, labelColor) => ({
    font: axisFont,
    stroke: labelColor,
    grid: { stroke: gridColor, width: 1 },
    ticks: { stroke: gridColor, width: 1, size: tickSize },
    size: 60,
    gap: axisGap,
    splits: self => {
      const count = chart.getVisibleHeatmapIds().length
      if (!count) return []

      const heightPx = self.bbox.height / (self.pxRatio || 1)
      const maxTicks = Math.max(1, Math.floor(heightPx / heatmapPixelsPerLabel))
      const step = Math.max(1, Math.ceil(count / Math.max(1, maxTicks - 1)))

      const splits = []
      for (let i = 0; i < count; i++) if (i % step === 0) splits.push(i)
      return splits
    },
    values: (self, splits) => {
      const ids = chart.getVisibleHeatmapIds()
      const scale = chart.getHeatmapScale()
      return splits.map(index => formatHeatmapLabel(withoutPrefix(ids[index]), scale))
    },
  })

  const getAxes = () => {
    if (chart.isSparkline()) return [{ show: false }, { show: false }]

    const enabledXAxis = chart.getAttribute("enabledXAxis") !== false
    const enabledYAxis = chart.getAttribute("enabledYAxis") !== false
    const gridColor = chart.getThemeAttribute("themeGridColor")
    const labelColor = chart.getThemeAttribute("themeLabelColor")
    const dimensionId = chart.getVisibleDimensionIds()?.[0]

    const xAxis = {
      show: true,
      font: axisFont,
      stroke: labelColor,
      grid: { stroke: gridColor, width: 1 },
      space: xTickSpace,
      gap: axisGap,
      ...(enabledXAxis
        ? {
            ticks: { stroke: gridColor, width: 1, size: tickSize },
            values: (self, splits) =>
              splits.map(value => chart.formatXAxis(new Date(value * 1000))),
          }
        : { ticks: { show: false }, values: () => [], size: hiddenAxisSize }),
    }

    if (chart.getAttribute("chartType") === "heatmap") {
      const heatmapYAxis = getHeatmapYAxis(gridColor, labelColor)
      return [
        xAxis,
        enabledYAxis
          ? { show: true, ...heatmapYAxis }
          : {
              show: true,
              ...heatmapYAxis,
              ticks: { show: false },
              values: () => [],
              size: hiddenAxisSize,
            },
      ]
    }

    const yAxis = {
      show: true,
      font: axisFont,
      stroke: labelColor,
      grid: { stroke: gridColor, width: 1 },
      gap: axisGap,
      ...(enabledYAxis
        ? {
            ticks: { stroke: gridColor, width: 1, size: tickSize },
            size: 60,
            values: (self, splits) =>
              splits.map(value => chart.getConvertedValueWithUnit(value, { dimensionId })),
          }
        : { ticks: { show: false }, values: () => [], size: hiddenAxisSize }),
    }

    return [xAxis, yAxis]
  }

  const drawVerticalLine = (self, dimensions, color, dash) => {
    if (!Array.isArray(dimensions)) return

    const timestamp = dimensions[0]
    if (timestamp == null) return

    const left = self.valToPos(timestamp / 1000, "x", true)
    const { top, height } = self.bbox

    const ctx = self.ctx
    ctx.save()
    ctx.beginPath()
    if (dash) ctx.setLineDash(dash)
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.moveTo(left, top)
    ctx.lineTo(left, top + height)
    ctx.stroke()
    ctx.restore()
  }

  const drawStackSegment = (self, ctx, xs, series, start, end, color, edgeWidth) => {
    ctx.beginPath()

    for (let row = start; row <= end; row++) {
      const x = self.valToPos(xs[row], "x", true)
      const y = self.valToPos(series[row][1], "y", true)

      if (row === start) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    for (let row = end; row >= start; row--) {
      ctx.lineTo(self.valToPos(xs[row], "x", true), self.valToPos(series[row][0], "y", true))
    }

    ctx.closePath()
    ctx.fillStyle = `${color}${stackedFillAlpha}`
    ctx.fill()

    ctx.beginPath()

    for (let row = start; row <= end; row++) {
      const x = self.valToPos(xs[row], "x", true)
      const y = self.valToPos(series[row][1], "y", true)

      if (row === start) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }

    ctx.lineWidth = edgeWidth
    ctx.strokeStyle = `${color}${stackedEdgeAlpha}`
    ctx.stroke()
  }

  const drawStacked = self => {
    if (chart.getAttribute("chartType") !== "stacked") return

    const dimensionIds = chart.getPayloadDimensionIds()
    const bounds = stackBounds()
    const xs = self.data[0]
    const { ctx } = self

    ctx.save()
    ctx.beginPath()
    ctx.rect(self.bbox.left, self.bbox.top, self.bbox.width, self.bbox.height)
    ctx.clip()

    const edgeWidth = window.devicePixelRatio || 1

    dimensionIds.forEach((id, index) => {
      const series = bounds[index]
      if (!series) return

      const color = chart.selectDimensionColor(id)

      getStackSegments(series, xs.length).forEach(([start, end]) =>
        drawStackSegment(self, ctx, xs, series, start, end, color, edgeWidth)
      )
    })

    ctx.restore()
  }

  const drawHeatmap = self => {
    if (chart.getAttribute("chartType") !== "heatmap") return

    const dimensionIds = chart.getPayloadDimensionIds()
    const xs = self.data[0]
    if (!xs || !xs.length) return

    const { ctx } = self
    const getColor = makeGetColor(chart)

    let minWidthSep = Infinity
    for (let i = 1; i < xs.length; i++) {
      const sep = self.valToPos(xs[i], "x", true) - self.valToPos(xs[i - 1], "x", true)
      if (sep < minWidthSep) minWidthSep = sep
    }

    const barWidth = Number.isFinite(minWidthSep) ? Math.floor(minWidthSep) : self.bbox.width
    const rowHeight = Math.abs(self.valToPos(1, "y", true) - self.valToPos(0, "y", true))

    ctx.save()
    ctx.beginPath()
    ctx.rect(self.bbox.left, self.bbox.top, self.bbox.width, self.bbox.height)
    ctx.clip()

    dimensionIds.forEach(id => {
      const yIndex = chart.getHeatmapYIndex(id)
      if (yIndex === -1) return

      const yTop = self.valToPos(yIndex, "y", true) - rowHeight / 2

      for (let row = 0; row < xs.length; row++) {
        const value = chart.getDimensionValue(id, row, { allowNull: true })
        ctx.fillStyle = getColor(value)
        ctx.fillRect(self.valToPos(xs[row], "x", true) - barWidth / 2, yTop, barWidth, rowHeight)
      }
    })

    ctx.restore()
  }

  const getBarSlotWidth = self => {
    const xs = self.data[0]

    let minSep = Infinity
    for (let i = 1; i < xs.length; i++) {
      const sep = self.valToPos(xs[i], "x", true) - self.valToPos(xs[i - 1], "x", true)
      if (sep < minSep) minSep = sep
    }

    return Number.isFinite(minSep) ? minSep : self.bbox.width
  }

  const drawGroupedBars = (self, dimensionIds, groupWidth) => {
    const xs = self.data[0]
    const { ctx } = self
    const y0 = self.valToPos(0, "y", true)

    const visibleIds = dimensionIds.filter(id => chart.isDimensionVisible(id))
    const barCount = visibleIds.length || 1
    const barWidth = groupWidth / barCount

    dimensionIds.forEach((id, index) => {
      if (!chart.isDimensionVisible(id)) return

      const values = self.data[index + 1]
      const barIndex = visibleIds.indexOf(id)
      ctx.fillStyle = chart.selectDimensionColor(id)

      for (let row = 0; row < xs.length; row++) {
        const value = values[row]
        if (value == null) continue

        const valuePos = self.valToPos(value, "y", true)
        const left = self.valToPos(xs[row], "x", true) - groupWidth / 2 + barIndex * barWidth

        ctx.fillRect(left, Math.min(y0, valuePos), barWidth, Math.abs(valuePos - y0))
      }
    })
  }

  const drawStackedBars = (self, dimensionIds, groupWidth) => {
    const xs = self.data[0]
    const { ctx } = self

    const omit = index => !chart.isDimensionVisible(dimensionIds[index - 1])
    const { data } = stack(self.data, omit)

    dimensionIds.forEach((id, index) => {
      const seriesIndex = index + 1
      if (omit(seriesIndex)) return

      const tops = data[seriesIndex]
      const raw = self.data[seriesIndex]
      ctx.fillStyle = chart.selectDimensionColor(id)

      for (let row = 0; row < xs.length; row++) {
        const top = tops[row]
        const value = raw[row]
        if (top == null || value == null) continue

        const topPos = self.valToPos(top, "y", true)
        const basePos = self.valToPos(top - value, "y", true)
        const left = self.valToPos(xs[row], "x", true) - groupWidth / 2

        ctx.fillRect(left, Math.min(topPos, basePos), groupWidth, Math.abs(topPos - basePos))
      }
    })
  }

  const drawBars = self => {
    const chartType = chart.getAttribute("chartType")
    if (!isBarType(chartType)) return

    const xs = self.data[0]
    if (!xs || !xs.length) return

    const dimensionIds = chart.getPayloadDimensionIds()
    const groupWidth = Math.max(1, getBarSlotWidth(self) * barGroupWidth)
    const { ctx } = self

    ctx.save()
    ctx.beginPath()
    ctx.rect(self.bbox.left, self.bbox.top, self.bbox.width, self.bbox.height)
    ctx.clip()

    if (chartType === "stackedBar") drawStackedBars(self, dimensionIds, groupWidth)
    else drawGroupedBars(self, dimensionIds, groupWidth)

    ctx.restore()
  }

  const drawAnomaly = makeAnomaly(chartUI)
  const drawAnnotations = makeAnnotations(chartUI)
  const getHoverDimension = makeGetHoverDimension(chart)

  const getYAxisValueRange = () => {
    if (chart.getAttribute("chartType") === "heatmap")
      return [chart.getAttribute("min"), chart.getAttribute("max")]

    return chart.getAttribute("getValueRange")(chart)
  }

  const fireYAxisChange = () => {
    const [min, max] = getYAxisValueRange()
    if (min == null || max == null) return
    if (min === prevYMin && max === prevYMax) return

    prevYMin = min
    prevYMax = max
    chart.trigger("yAxisChange", min, max)
  }

  const draw = self => {
    const crosshairColor = chart.getThemeAttribute("themeCrosshair")
    drawVerticalLine(self, chart.getAttribute("hoverX"), crosshairColor, [4, 4])
    drawVerticalLine(self, chart.getAttribute("clickX"), crosshairColor, null)
  }

  const drawOverlays = self => overlays && overlays.draw(self)

  const setCursor = self => {
    if (!chart.getAttribute("enabledHover")) return

    const { left, idx } = self.cursor
    const outside = left == null || left < 0 || idx == null

    if (outside) {
      if (!hovering) return

      hovering = false
      sdk.trigger("highlightBlur", chart)
      chart.trigger("highlightBlur")
      sdk.trigger("blurChart", chart)
      return
    }

    if (!hovering) {
      hovering = true
      sdk.trigger("hoverChart", chart)
    }

    const timestamp = self.data[0][idx] * 1000
    const dimensionId = getHoverDimension(self)
    sdk.trigger("highlightHover", chart, timestamp, dimensionId)
    chart.trigger("highlightHover", timestamp, dimensionId)
  }

  const emitNav = (name, ...args) => sdk.trigger(name, chart, ...args)

  const isNearAnnotation = offsetX => {
    const overlays = chart.getAttribute("overlays")

    for (const overlayId in overlays) {
      const overlay = overlays[overlayId]
      if (overlay.type !== "annotation") continue

      const annotationX = u.valToPos(overlay.timestamp, "x")
      if (Math.abs(offsetX - annotationX) < 10) return true
    }

    return false
  }

  const annotate = (offsetX, xMs) => {
    if (isNearAnnotation(offsetX)) return

    const existingDraft = chart.getAttribute("draftAnnotation")
    if (existingDraft && existingDraft.status === "editing") return

    chart.updateAttribute("draftAnnotation", {
      timestamp: xMs / 1000,
      createdAt: new Date(),
      status: "draft",
    })

    emitNav("annotationCreate", xMs / 1000)
    chart.trigger("annotationCreate", xMs / 1000)
  }

  const getCursor = () => {
    const nav = chart.getAttribute("enabledNavigation") ? chart.getAttribute("navigation") : null
    const drag =
      nav === "selectVertical"
        ? { x: false, y: true, setScale: false }
        : nav === "select" || nav === "highlight"
          ? { x: true, y: false, setScale: false }
          : { x: false, y: false }

    return { focus: { prox: 16 }, drag }
  }

  const updateCursorDrag = () => {
    if (!u) return

    const { drag } = getCursor()
    u.cursor.drag.x = !!drag.x
    u.cursor.drag.y = !!drag.y
    u.cursor.drag.setScale = false
    u.redraw(false, false)
  }

  const onSetSelect = self => {
    if (!chart.getAttribute("enabledNavigation")) return

    const nav = chart.getAttribute("navigation")
    const vertical = nav === "selectVertical"
    if (nav !== "select" && nav !== "highlight" && !vertical) return
    if (selectEnded) return
    selectEnded = true

    const { select } = self

    if (vertical) {
      const range =
        select.height >= minDragPx
          ? [self.posToVal(select.top + select.height, "y"), self.posToVal(select.top, "y")]
          : null
      emitNav("highlightVerticalEnd", range)
    } else {
      const range =
        select.width >= minDragPx
          ? [
              Math.round(self.posToVal(select.left, "x")),
              Math.round(self.posToVal(select.left + select.width, "x")),
            ]
          : null
      emitNav("highlightEnd", range)
    }

    self.setSelect({ left: 0, top: 0, width: 0, height: 0 }, false)
  }

  const moveXDebounced = debounce(300, (after, before) => {
    chart.moveX(after, before)
    xRangeOverride = null
  })

  const onWheel = event => {
    if (!chart.getAttribute("enabledNavigation")) return
    if (!event.shiftKey && !event.altKey) return

    event.preventDefault()

    const left = u.cursor.left
    if (left == null || left < 0) return

    const rect = u.over.getBoundingClientRect()
    const leftPct = left / rect.width
    const xVal = u.posToVal(left, "x")
    const range = u.scales.x.max - u.scales.x.min
    const factor = 0.75
    const nextRange = event.deltaY < 0 ? range * factor : range / factor
    const min = xVal - leftPct * nextRange
    const max = min + nextRange

    xRangeOverride = [min, max]
    u.setScale("x", { min, max })
    moveXDebounced(min, max)
  }

  const attachNavigation = () => {
    const over = u.over
    let detachDoc = null

    const onDown = event => {
      if (event.button !== 0) return
      if (!chart.getAttribute("enabledNavigation")) return
      if (chart.getAttribute("navigation") !== "pan") return

      event.preventDefault()

      const left0 = event.clientX
      const min0 = u.scales.x.min
      const max0 = u.scales.x.max
      const unitsPerPx = u.posToVal(1, "x") - u.posToVal(0, "x")

      emitNav("panStart")

      const onMove = ev => {
        const dx = unitsPerPx * (ev.clientX - left0)
        xRangeOverride = [min0 - dx, max0 - dx]
        u.setScale("x", { min: min0 - dx, max: max0 - dx })
      }

      const onUp = () => {
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
        detachDoc = null
        const [rangeMin, rangeMax] = xRangeOverride || [u.scales.x.min, u.scales.x.max]
        emitNav("panEnd", [rangeMin * 1000, rangeMax * 1000])
        xRangeOverride = null
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
      detachDoc = () => {
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }
    }

    const onDblClick = () => chart.resetNavigation()

    let downX = null
    let downY = null
    let dragged = false
    let downedOnOver = false
    let enabledHoverAtDown = false

    const onDownTrack = event => {
      if (event.button !== 0) return
      downX = event.clientX
      downY = event.clientY
      dragged = false
      downedOnOver = true
      enabledHoverAtDown = chart.getAttribute("enabledHover")
    }

    const onMoveTrack = event => {
      if (!downedOnOver) return
      if (Math.abs(event.clientX - downX) > 3 || Math.abs(event.clientY - downY) > 3)
        dragged = true
    }

    const onUpTrack = event => {
      if (!downedOnOver) return

      const wasDrag = dragged
      downedOnOver = false
      dragged = false

      if (wasDrag) return
      if (!enabledHoverAtDown) return

      const rect = over.getBoundingClientRect()
      const offsetX = event.clientX - rect.left
      if (offsetX < 0 || offsetX > rect.width) return

      const xMs = u.posToVal(offsetX, "x") * 1000

      annotate(offsetX, xMs)

      const dimensionId = chart.getVisibleDimensionIds()?.[0]
      emitNav("highlightClick", xMs, dimensionId)
      chart.trigger("highlightClick", xMs, dimensionId)
    }

    let lastTouchEndTime = 0
    let touchMoved = false
    let touchPanning = false
    let touchStartX = 0
    let touchMin0 = 0
    let touchMax0 = 0
    let touchUnitsPerPx = 0

    const onTouchStart = event => {
      if (!chart.getAttribute("enabledNavigation")) return

      const touch = event.touches[0]
      if (!touch) return

      touchMoved = false
      touchPanning = false
      touchStartX = touch.clientX
      touchMin0 = u.scales.x.min
      touchMax0 = u.scales.x.max
      touchUnitsPerPx = u.posToVal(1, "x") - u.posToVal(0, "x")
    }

    const onTouchMove = event => {
      if (!chart.getAttribute("enabledNavigation")) return

      const touch = event.touches[0]
      if (!touch) return

      event.preventDefault()

      if (!touchMoved) {
        touchMoved = true
        touchPanning = true
        emitNav("panStart")
      }

      const dx = touchUnitsPerPx * (touch.clientX - touchStartX)
      xRangeOverride = [touchMin0 - dx, touchMax0 - dx]
      u.setScale("x", { min: touchMin0 - dx, max: touchMax0 - dx })
    }

    const onTouchEnd = event => {
      if (!chart.getAttribute("enabledNavigation")) return

      const now = Date.now()

      if (now - lastTouchEndTime < doubleTapDelay) {
        lastTouchEndTime = now
        xRangeOverride = null
        chart.resetNavigation()
        return
      }

      lastTouchEndTime = now

      if (!touchMoved) {
        const touch = event.changedTouches?.[0]
        if (!touch) return

        const rect = over.getBoundingClientRect()
        const offsetX = touch.clientX - rect.left
        chart.updateAttribute("clickX", [u.posToVal(offsetX, "x") * 1000, null])
        return
      }

      if (touchPanning) {
        touchPanning = false
        const [rangeMin, rangeMax] = xRangeOverride || [u.scales.x.min, u.scales.x.max]
        emitNav("panEnd", [rangeMin * 1000, rangeMax * 1000])
        xRangeOverride = null
      }
    }

    let detachSelectUp = null

    const onSelectDown = event => {
      if (event.button !== 0) return
      if (!chart.getAttribute("enabledNavigation")) return

      const nav = chart.getAttribute("navigation")
      const vertical = nav === "selectVertical"
      if (nav !== "select" && nav !== "highlight" && !vertical) return

      selectEnded = false
      emitNav(vertical ? "highlightVerticalStart" : "highlightStart")

      const onSelectUp = () => {
        document.removeEventListener("mouseup", onSelectUp)
        detachSelectUp = null
        if (selectEnded) return
        selectEnded = true
        emitNav(vertical ? "highlightVerticalEnd" : "highlightEnd", null)
      }

      document.addEventListener("mouseup", onSelectUp)
      detachSelectUp = () => document.removeEventListener("mouseup", onSelectUp)
    }

    const modifierNavigation = event => {
      if (event.shiftKey && event.altKey) return "selectVertical"
      if (event.altKey) return "highlight"
      if (event.shiftKey) return "select"
      return null
    }

    const isSelectNavigation = navigation =>
      navigation === "select" || navigation === "highlight" || navigation === "selectVertical"

    const onModifierDown = event => {
      if (event.button !== 0) return
      if (!chart.getAttribute("enabledNavigation")) return

      const navigation = modifierNavigation(event)
      if (!navigation) return

      const current = chart.getAttribute("navigation")
      if (current === navigation) return

      const prevNavigation = chart.getAttribute("prevNavigation") || current
      if (isSelectNavigation(navigation)) selectEnded = false
      chart.updateAttributes({ navigation, prevNavigation })
    }

    const restoreNavigation = () => {
      const prevNavigation = chart.getAttribute("prevNavigation")
      if (prevNavigation) chart.updateAttributes({ navigation: prevNavigation, prevNavigation: null })
    }

    const onModifierUp = () => setTimeout(restoreNavigation)

    const switchTarget = over.parentNode || over

    switchTarget.addEventListener("mousedown", onModifierDown, true)
    over.addEventListener("mousedown", onDown)
    over.addEventListener("mousedown", onDownTrack)
    over.addEventListener("mousedown", onSelectDown)
    document.addEventListener("mousemove", onMoveTrack)
    document.addEventListener("mouseup", onUpTrack)
    document.addEventListener("mouseup", onModifierUp)
    over.addEventListener("wheel", onWheel, { passive: false })
    over.addEventListener("dblclick", onDblClick)
    over.addEventListener("touchstart", onTouchStart, { passive: false })
    over.addEventListener("touchmove", onTouchMove, { passive: false })
    over.addEventListener("touchend", onTouchEnd)

    return () => {
      switchTarget.removeEventListener("mousedown", onModifierDown, true)
      over.removeEventListener("mousedown", onDown)
      over.removeEventListener("mousedown", onDownTrack)
      over.removeEventListener("mousedown", onSelectDown)
      document.removeEventListener("mousemove", onMoveTrack)
      document.removeEventListener("mouseup", onUpTrack)
      document.removeEventListener("mouseup", onModifierUp)
      over.removeEventListener("touchstart", onTouchStart)
      over.removeEventListener("touchmove", onTouchMove)
      over.removeEventListener("touchend", onTouchEnd)
      over.removeEventListener("wheel", onWheel)
      over.removeEventListener("dblclick", onDblClick)
      if (detachDoc) detachDoc()
      if (detachSelectUp) detachSelectUp()
    }
  }

  const create = () => {
    if (!element) return

    const data = getData()
    const empty = !data
    if (empty && !chart.getAttribute("loaded")) return

    const scales = getScales()
    if (empty) scales.y = { range: () => [0, 1] }

    u = new uPlot(
      {
        width: chartUI.getChartWidth(),
        height: chartUI.getChartHeight(),
        legend: { show: false },
        cursor: getCursor(),
        scales,
        series: empty ? [{}] : getSeries(),
        axes: getAxes(),
        hooks: empty
          ? {}
          : {
              setCursor: [setCursor],
              draw: [
                fireYAxisChange,
                drawStacked,
                drawHeatmap,
                drawBars,
                drawAnomaly,
                drawAnnotations,
                draw,
                drawOverlays,
              ],
              setSelect: [onSetSelect],
            },
      },
      empty ? [[0]] : data,
      element
    )

    detachNavigation = attachNavigation()
  }

  const destroyChart = () => {
    if (!u) return

    if (detachNavigation) {
      detachNavigation()
      detachNavigation = null
    }

    u.destroy()
    u = null
  }

  const rebuild = () => {
    destroyChart()
    create()
  }

  const render = () => {
    if (!element) return

    const { highlighting, panning, processing } = chart.getAttributes()
    if (highlighting || panning || processing) return

    chartUI.render()

    const data = getData()
    if (!data && !chart.getAttribute("loaded")) {
      destroyChart()
      return
    }

    const frameData = data || [[0]]

    if (!u) create()
    else if (u.series.length !== frameData.length) rebuild()
    else u.setData(frameData)

    chartUI.trigger("rendered")
  }

  const mount = el => {
    if (u) return

    element = el
    chartUI.mount(el)
    element.classList.add(chart.getAttribute("theme"))

    resizeObserver = makeResizeObserver(
      element,
      () => chartUI.trigger("resize"),
      () => chartUI.trigger("resize")
    )

    const { loaded } = chart.getAttributes()

    listeners = unregister(
      chartUI.on("resize", () => {
        if (u) u.setSize({ width: chartUI.getChartWidth(), height: chartUI.getChartHeight() })
      }),
      chart.onAttributeChange("hoverX", () => u && u.redraw(false, false)),
      chart.onAttributeChange("clickX", () => u && u.redraw(false, false)),
      chart.onAttributeChange("overlays", overlays.toggle),
      chart.onAttributeChange("draftAnnotation", overlays.toggle),
      chart.onAttributeChange("selectedLegendDimensions", rebuild),
      chart.onAttributeChange("chartType", rebuild),
      chart.onAttributeChange("navigation", updateCursorDrag),
      chart.onAttributeChange("enabledNavigation", rebuild),
      chart.onAttributeChange("enabledXAxis", rebuild),
      chart.onAttributeChange("enabledYAxis", rebuild),
      chart.onAttributeChange("staticValueRange", () => u && u.setData(u.data, true)),
      chart.onAttributeChange("timezone", () => u && u.redraw()),
      chart.onAttributeChange("unitsConversionPrefix", () => u && u.redraw()),
      chart.onAttributeChange("theme", (next, prev) => {
        element.classList.remove(prev)
        element.classList.add(next)
        rebuild()
      }),
      !loaded && chart.onceAttributeChange("loaded", render)
    )

    render()
  }

  const unmount = () => {
    if (listeners) listeners()
    if (resizeObserver) resizeObserver()

    destroyChart()
    hovering = false
    element = null
    chartUI.unmount()
  }

  const getUPlot = () => u

  const getChartWidth = () => (u ? u.over.clientWidth : chartUI.getChartWidth())

  const getChartHeight = () => (u ? u.over.clientHeight : chartUI.getChartHeight())

  const getXAxisRange = () => (u ? [u.scales.x.min * 1000, u.scales.x.max * 1000] : null)

  const getPlotArea = () => {
    if (!u) return { left: 0, top: 0, width: 0, height: 0 }
    const dpr = u.pxRatio || 1
    return {
      left: u.bbox.left / dpr,
      top: u.bbox.top / dpr,
      width: u.bbox.width / dpr,
      height: u.bbox.height / dpr,
    }
  }

  const getXCoord = timestampMs => {
    if (!u) return 0
    const dpr = u.pxRatio || 1
    return u.bbox.left / dpr + u.valToPos(timestampMs / 1000, "x")
  }

  const instance = {
    ...chartUI,
    getChartWidth,
    getChartHeight,
    mount,
    unmount,
    render,
    getUPlot,
    getXAxisRange,
    getPlotArea,
    getXCoord,
  }

  overlays = makeOverlays(instance)

  return instance
}
