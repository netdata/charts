import uPlot from "uplot"
import { debounce } from "throttle-debounce"
import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"

const fillAlpha = "40"

const barsPathBuilder = uPlot.paths.bars && uPlot.paths.bars({ size: [0.6, 100], align: 0 })
const steppedPathBuilder = uPlot.paths.stepped && uPlot.paths.stepped({ align: 1 })

const barTypes = { multiBar: true, stackedBar: true, bars: true }

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let u = null
  let element = null
  let listeners
  let resizeObserver
  let hovering = false
  let detachNavigation = null

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

  const getPaths = () => {
    const chartType = chart.getAttribute("chartType")

    if (barTypes[chartType]) return barsPathBuilder
    if (chart.getAttribute("stepPlot")) return steppedPathBuilder

    return undefined
  }

  const getSeries = () => {
    const chartType = chart.getAttribute("chartType")
    const filled = chartType === "area" || chartType === "stacked" || barTypes[chartType]
    const paths = getPaths()

    return [
      {},
      ...chart.getPayloadDimensionIds().map(id => {
        const color = chart.selectDimensionColor(id)

        return {
          label: id,
          show: chart.isDimensionVisible(id),
          stroke: color,
          width: chartType === "line" ? 1.5 : 1,
          ...(paths && { paths }),
          ...(filled && { fill: `${color}${fillAlpha}` }),
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
        stroke: labelColor,
        grid: { stroke: gridColor, width: 1 },
        ticks: { stroke: gridColor, width: 1 },
        values: (self, splits) => splits.map(value => chart.formatXAxis(new Date(value * 1000))),
      },
      {
        stroke: labelColor,
        grid: { stroke: gridColor, width: 1 },
        ticks: { stroke: gridColor, width: 1 },
        size: 60,
        values: (self, splits) =>
          splits.map(value => chart.getConvertedValueWithUnit(value, { dimensionId })),
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

  const draw = self => {
    const crosshairColor = chart.getThemeAttribute("themeCrosshair")
    drawVerticalLine(self, chart.getAttribute("hoverX"), crosshairColor, [3, 3])
    drawVerticalLine(self, chart.getAttribute("clickX"), crosshairColor, null)
  }

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

  const create = () => {
    if (!element) return

    const data = getData()
    if (!data) return

    u = new uPlot(
      {
        width: chartUI.getChartWidth(),
        height: chartUI.getChartHeight(),
        legend: { show: false },
        cursor: getCursor(),
        scales: getScales(),
        series: getSeries(),
        axes: getAxes(),
        hooks: { setCursor: [setCursor], draw: [draw], setSelect: [onSetSelect] },
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
    else if (u.series.length !== data.length) rebuild()
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

  const instance = {
    ...chartUI,
    getChartWidth,
    getChartHeight,
    mount,
    unmount,
    render,
    getUPlot,
  }

  return instance
}
