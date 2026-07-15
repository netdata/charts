import uPlot from "uplot"
import { debounce } from "throttle-debounce"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import { getStackBounds, getStackValueRange } from "./stacking"
import { seriesBarsPlugin } from "./bars/seriesBarsPlugin"
import { stack } from "./bars/stack"
import makeOverlays from "./overlays"

const barTypes = { multiBar: true, stackedBar: true }

const axisFont = "11px 'IBM Plex Sans', sans-serif"
const tickSize = 4
const axisGap = 6
const xTickSpace = 80

const lineWidth = 2
const areaLineWidth = 1.5
const areaGradientTopAlpha = "59"
const areaGradientBottomAlpha = "00"
const stackedFillAlpha = "CC"
const stackedEdgeAlpha = "E6"

const steppedPathBuilder = uPlot.paths.stepped && uPlot.paths.stepped({ align: 1 })
const nullPathBuilder = () => null

const makeAreaFill = color => self => {
  const { ctx, bbox } = self
  const gradient = ctx.createLinearGradient(0, bbox.top, 0, bbox.top + bbox.height)
  gradient.addColorStop(0, `${color}${areaGradientTopAlpha}`)
  gradient.addColorStop(1, `${color}${areaGradientBottomAlpha}`)
  return gradient
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

  const getPaths = () => {
    if (chart.getAttribute("chartType") === "stacked") return nullPathBuilder
    if (chart.getAttribute("stepPlot")) return steppedPathBuilder

    return undefined
  }

  const getSeries = () => {
    const chartType = chart.getAttribute("chartType")
    const filled = chartType === "area"
    const paths = getPaths()

    return [
      {},
      ...chart.getPayloadDimensionIds().map(id => {
        const color = chart.selectDimensionColor(id)

        return {
          label: id,
          show: chart.isDimensionVisible(id),
          stroke: color,
          width: filled ? areaLineWidth : lineWidth,
          ...(paths && { paths }),
          ...(filled && { fill: makeAreaFill(color) }),
        }
      }),
    ]
  }

  const getScales = () => ({
    x: {
      time: true,
      range: () => {
        const [after, before] = chart.getDateWindow()
        return [after / 1000, before / 1000]
      },
    },
    y: {
      range: (self, dataMin, dataMax) => {
        if (chart.getAttribute("chartType") === "stacked") return getStackValueRange(stackBounds())

        const [min, max] = chart.getAttribute("getValueRange")(chart)
        return [min == null ? dataMin : min, max == null ? dataMax : max]
      },
    },
  })

  const getAxes = () => {
    if (chart.isSparkline()) return [{ show: false }, { show: false }]

    const gridColor = chart.getThemeAttribute("themeGridColor")
    const labelColor = chart.getThemeAttribute("themeLabelColor")
    const dimensionId = chart.getVisibleDimensionIds()?.[0]

    return [
      {
        font: axisFont,
        stroke: labelColor,
        grid: { stroke: gridColor, width: 1 },
        ticks: { stroke: gridColor, width: 1, size: tickSize },
        space: xTickSpace,
        gap: axisGap,
        values: (self, splits) => splits.map(value => chart.formatXAxis(new Date(value * 1000))),
      },
      {
        font: axisFont,
        stroke: labelColor,
        grid: { stroke: gridColor, width: 1 },
        ticks: { stroke: gridColor, width: 1, size: tickSize },
        size: 60,
        gap: axisGap,
        values: (self, splits) =>
          splits.map(value => chart.getConvertedValueWithUnit(value, { dimensionId })),
      },
    ]
  }

  const getBarAxes = () => {
    const gridColor = chart.getThemeAttribute("themeGridColor")
    const labelColor = chart.getThemeAttribute("themeLabelColor")

    return [
      { font: axisFont, stroke: labelColor, gap: axisGap },
      {
        font: axisFont,
        stroke: labelColor,
        grid: { stroke: gridColor, width: 1 },
        ticks: { stroke: gridColor, width: 1, size: tickSize },
        gap: axisGap,
      },
    ]
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

      ctx.beginPath()
      let started = false

      for (let row = 0; row < xs.length; row++) {
        const bound = series[row]
        if (!bound) continue

        const x = self.valToPos(xs[row], "x", true)
        const y = self.valToPos(bound[1], "y", true)

        if (started) ctx.lineTo(x, y)
        else {
          ctx.moveTo(x, y)
          started = true
        }
      }

      for (let row = xs.length - 1; row >= 0; row--) {
        const bound = series[row]
        if (!bound) continue

        ctx.lineTo(self.valToPos(xs[row], "x", true), self.valToPos(bound[0], "y", true))
      }

      if (!started) return

      ctx.closePath()
      ctx.fillStyle = `${color}${stackedFillAlpha}`
      ctx.fill()

      ctx.beginPath()
      let edgeStarted = false

      for (let row = 0; row < xs.length; row++) {
        const bound = series[row]
        if (!bound) continue

        const x = self.valToPos(xs[row], "x", true)
        const y = self.valToPos(bound[1], "y", true)

        if (edgeStarted) ctx.lineTo(x, y)
        else {
          ctx.moveTo(x, y)
          edgeStarted = true
        }
      }

      ctx.lineWidth = edgeWidth
      ctx.strokeStyle = `${color}${stackedEdgeAlpha}`
      ctx.stroke()
    })

    ctx.restore()
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
      sdk.trigger("blurChart", chart)
      return
    }

    if (!hovering) {
      hovering = true
      sdk.trigger("hoverChart", chart)
    }

    const timestamp = self.data[0][idx] * 1000
    const dimensionId = chart.getVisibleDimensionIds()?.[0]
    sdk.trigger("highlightHover", chart, timestamp, dimensionId)
  }

  const emitNav = (name, ...args) => sdk.trigger(name, chart, ...args)

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

  const onSetSelect = self => {
    if (!chart.getAttribute("enabledNavigation")) return

    const nav = chart.getAttribute("navigation")
    const { select } = self

    if (nav === "selectVertical" && select.height > 0) {
      const min = self.posToVal(select.top + select.height, "y")
      const max = self.posToVal(select.top, "y")
      emitNav("highlightVerticalStart")
      emitNav("highlightVerticalEnd", [min, max])
    } else if ((nav === "select" || nav === "highlight") && select.width > 0) {
      const after = Math.round(self.posToVal(select.left, "x"))
      const before = Math.round(self.posToVal(select.left + select.width, "x"))
      emitNav("highlightStart")
      emitNav("highlightEnd", [after, before])
    }

    self.setSelect({ left: 0, top: 0, width: 0, height: 0 }, false)
  }

  const moveXDebounced = debounce(300, (after, before) => chart.moveX(after, before))

  const onWheel = event => {
    if (!chart.getAttribute("enabledNavigation")) return

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
        u.setScale("x", { min: min0 - dx, max: max0 - dx })
      }

      const onUp = () => {
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
        detachDoc = null
        emitNav("panEnd", [u.scales.x.min * 1000, u.scales.x.max * 1000])
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
      detachDoc = () => {
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }
    }

    const onDblClick = () => chart.resetNavigation()

    over.addEventListener("mousedown", onDown)
    over.addEventListener("wheel", onWheel, { passive: false })
    over.addEventListener("dblclick", onDblClick)

    return () => {
      over.removeEventListener("mousedown", onDown)
      over.removeEventListener("wheel", onWheel)
      over.removeEventListener("dblclick", onDblClick)
      if (detachDoc) detachDoc()
    }
  }

  const getBarSeries = () => [
    {},
    ...chart.getPayloadDimensionIds().map(id => ({
      label: id,
      show: chart.isDimensionVisible(id),
      fill: chart.selectDimensionColor(id),
      width: 0,
    })),
  ]

  const createBars = data => {
    const chartType = chart.getAttribute("chartType")
    let barData = data
    let bands

    if (chartType === "stackedBar") {
      const stacked = stack(data, () => false)
      barData = stacked.data
      bands = stacked.bands
    }

    u = new uPlot(
      {
        width: chartUI.getChartWidth(),
        height: chartUI.getChartHeight(),
        legend: { show: false },
        ...(bands && { bands }),
        axes: getBarAxes(),
        series: getBarSeries(),
        plugins: [
          seriesBarsPlugin({
            ori: 0,
            dir: 1,
            stacked: chartType === "stackedBar",
            groupWidth: 0.6,
            radius: 0.15,
          }),
        ],
      },
      barData,
      element
    )
  }

  const create = () => {
    if (!element) return

    const data = getData()
    if (!data) return

    if (barTypes[chart.getAttribute("chartType")]) {
      createBars(data)
      return
    }

    u = new uPlot(
      {
        width: chartUI.getChartWidth(),
        height: chartUI.getChartHeight(),
        legend: { show: false },
        cursor: getCursor(),
        scales: getScales(),
        series: getSeries(),
        axes: getAxes(),
        hooks: {
          setCursor: [setCursor],
          draw: [drawStacked, draw, drawOverlays],
          setSelect: [onSetSelect],
        },
      },
      data,
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
    if (!data) {
      destroyChart()
      return
    }

    if (!u) create()
    else if (barTypes[chart.getAttribute("chartType")] || u.series.length !== data.length) rebuild()
    else u.setData(data)

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
      chart.onAttributeChange("navigation", rebuild),
      chart.onAttributeChange("enabledNavigation", rebuild),
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
