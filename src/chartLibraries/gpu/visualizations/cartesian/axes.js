import Dygraph from "dygraphs"
import { makeAxisTicks } from "@/helpers/ticks"

const X_AXIS_HEIGHT = 16
const Y_AXIS_GUTTER = 6
const RIGHT_PLOT_OVERFLOW = 5
const DEFAULT_Y_AXIS_WIDTH = 68
const Y_RANGE_PAD = 15

const getTickGranularity = (ticks, index) => {
  const value = ticks[index].v
  const previous = ticks[index - 1]?.v
  const next = ticks[index + 1]?.v
  const previousStep = typeof previous === "number" ? Math.abs(value - previous) : Infinity
  const nextStep = typeof next === "number" ? Math.abs(next - value) : Infinity
  const step = Math.min(previousStep, nextStep)
  return isFinite(step) ? step : 0
}

export const makePlotArea = (chart, width, height) => {
  const sparkline = chart.isSparkline()
  const enabledXAxis = !sparkline && chart.getAttribute("enabledXAxis")
  const enabledYAxis = !sparkline && chart.getAttribute("enabledYAxis")
  const left = enabledYAxis
    ? (chart.getAttribute("yAxisLabelWidth") || DEFAULT_Y_AXIS_WIDTH) + Y_AXIS_GUTTER
    : 0
  const bottom = enabledXAxis ? X_AXIS_HEIGHT : 0

  return {
    left,
    top: 0,
    width: Math.max(1, width + RIGHT_PLOT_OVERFLOW - left),
    height: Math.max(1, height - bottom),
  }
}

export const padValueRange = (min, max, plotHeight) => {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [-1, 1]
  if (min === max) {
    const padding = Math.abs(min || 1) * 0.01
    return [min - padding, max + padding]
  }
  const padding = ((max - min) * Y_RANGE_PAD) / Math.max(1, plotHeight)
  return [min - padding, max + padding]
}

const xPosition = (value, min, max, plot) =>
  plot.left + ((value - min) / Math.max(max - min, 1e-20)) * plot.width

const yPosition = (value, min, max, plot) =>
  plot.top + (1 - (value - min) / Math.max(max - min, 1e-20)) * plot.height

const makeYLabel = (chart, value, granularity) => {
  const dimensionId = chart.getVisibleDimensionIds()?.[0]
  const range = granularity
    ? {
        min: Math.min(value, value + granularity),
        max: Math.max(value, value + granularity),
      }
    : {}
  const unitAttributes = chart.getUnitAttributesForValue(value, { dimensionId, ...range })
  return chart.getConvertedValueWithUnit(value, { dimensionId, unitAttributes })
}

const makeXTicks = (chart, min, max, pixels) =>
  Dygraph.dateTicker(
    min,
    max,
    pixels,
    key => {
      if (key === "pixelsPerLabel") return 60
      if (key === "axisLabelFormatter") return chart.formatXAxis
      if (key === "labelsUTC") return false
      return undefined
    },
    null
  )

export const makeCartesianAxes = ({ chart, width, height, min, max, afterMs, beforeMs }) => {
  const plot = makePlotArea(chart, width, height)
  const [domainMin, domainMax] = padValueRange(min, max, plot.height)
  const sparkline = chart.isSparkline()
  const enabledXAxis = !sparkline && chart.getAttribute("enabledXAxis")
  const enabledYAxis = !sparkline && chart.getAttribute("enabledYAxis")
  const gridColor = chart.getThemeAttribute("themeGridColor")
  const labelColor = chart.getThemeAttribute("themeLabelColor")
  const font = `${chart.getAttribute("axisLabelFontSize") || 10}px sans-serif`
  const rects = []
  const labels = []

  if (enabledYAxis) {
    const units = chart.getVisibleDimensionIds().map(id => chart.getDimensionUnit(id))
    const yTicks = makeAxisTicks({
      min,
      max,
      pixels: plot.height,
      pixelsPerTick: 15,
      units,
      secondsAsTime: chart.getAttribute("secondsAsTime"),
    }).filter(tick => tick.v >= min && tick.v <= max)

    yTicks.forEach((tick, index) => {
      const y = yPosition(tick.v, domainMin, domainMax, plot)
      rects.push({ x: plot.left, y, width: plot.width, height: 1, color: gridColor })
      labels.push({
        text: makeYLabel(chart, tick.v, getTickGranularity(yTicks, index)),
        x: plot.left + 2,
        y,
        align: "right",
        verticalAlign: "middle",
        color: labelColor,
        font,
      })
    })
  }

  if (enabledXAxis) {
    makeXTicks(chart, afterMs, beforeMs, plot.width).forEach(tick => {
      const x = xPosition(tick.v, afterMs, beforeMs, plot)
      rects.push({ x, y: plot.top, width: 1, height: plot.height, color: gridColor })
      labels.push({
        text: tick.label,
        x,
        y: plot.top + plot.height + 1,
        align: "center",
        verticalAlign: "top",
        color: labelColor,
        font,
      })
    })
  }

  return { plot, domain: [domainMin, domainMax], rects, labels }
}
