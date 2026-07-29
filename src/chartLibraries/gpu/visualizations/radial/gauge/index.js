import { parseColor } from "@/chartLibraries/gpu/color"
import { UnsupportedVisualizationConfigurationError } from "@/chartLibraries/gpu/errors"
import { unregister } from "@/helpers/makeListeners"
import lightenColor from "@/chartLibraries/gauge/makeGradientColors"
import makeThresholdStops from "@/chartLibraries/gauge/makeThresholdStops"
import { getEasyPieValue } from "../easyPie"

const ANGLE = -0.2
const START_ANGLE = (1 + ANGLE) * Math.PI
const TOTAL_SWEEP = (1 - ANGLE * 2) * Math.PI

const getThresholdColor = (stops, percentage) => {
  const fraction = percentage / 100
  return stops.find(([position]) => fraction <= position)?.[1] || stops.at(-1)[1]
}

export const isGaugeConfigurationSupported = chart => !chart?.getAttribute("staticZones")

export const makeGaugeFrame = (chart, { width, height, dpr, colors }) => {
  if (!isGaugeConfigurationSupported(chart))
    throw new UnsupportedVisualizationConfigurationError(
      "GPU Gauge does not support staticZones"
    )

  const value = getEasyPieValue(chart)
  if (value == null) return null
  const [min, max] = chart.getAttribute("getValueRange")(chart)
  const rawPercentage = ((value - min) / (max - min)) * 100
  const percentage = Number.isNaN(rawPercentage)
    ? 0
    : Math.max(Math.min(rawPercentage, 99.999), 0.001)
  const gaugeHeight = Math.min(width, height) * 0.9
  const canvasHeight = gaugeHeight * dpr
  const canvasWidth = width * dpr
  const availableHeight = canvasHeight * 0.8
  const lineWidth = availableHeight * chart.getAttribute("gaugeLineWidth")
  const extraPadding = Math.sin(START_ANGLE)
  const radius = (availableHeight - lineWidth / 2) / (1 + extraPadding)
  const canvasTop = ((height - gaugeHeight) * dpr) / 2
  const centerX = canvasWidth / 2
  const centerY =
    canvasTop + canvasHeight * 0.1 + availableHeight - (radius + lineWidth / 2) * extraPadding
  const pointerWidth = canvasHeight * 0.035
  const pointerLength = radius * 1.2
  const progressSweep = (percentage / 100) * TOTAL_SWEEP
  const dimensionColor = colors.dimension
  const thresholds = makeThresholdStops(
    chart.getAttribute("gaugeThresholds"),
    min,
    max,
    chart.getThemeIndex(),
    dimensionColor
  )
  const thresholdColor = thresholds
    ? getThresholdColor(thresholds, percentage)
    : dimensionColor
  const gradientEnabled = chart.getAttribute("gaugeGradient") && !thresholds

  return {
    width,
    height,
    dpr,
    centerX,
    centerY,
    radius,
    lineWidth,
    startAngle: START_ANGLE,
    totalSweep: TOTAL_SWEEP,
    progressSweep,
    pointerAngle: START_ANGLE + progressSweep,
    pointerWidth,
    pointerLength,
    gradientEnabled,
    progressStartColor: parseColor(
      gradientEnabled ? lightenColor(dimensionColor) : thresholdColor
    ),
    progressEndColor: parseColor(thresholdColor),
    trackColor: parseColor(colors.track),
    pointerColor: parseColor(colors.pointer),
    value,
    min,
    max,
    percentage,
  }
}

export default ({ chart, makeResources }) => {
  let resource = null
  let listeners = null
  let colors = null
  let prevMin
  let prevMax
  let drawStats = null

  const updateColors = () => {
    colors = {
      dimension: chart.selectDimensionColor(),
      pointer: chart.getThemeAttribute("themeGaugePointer"),
      track: chart.getThemeAttribute("themeGaugeStroke"),
    }
  }

  const mount = ({ render }) => {
    updateColors()
    const { loaded } = chart.getAttributes()
    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render),
      chart.onAttributeChange("gaugeThresholds", render),
      chart.onAttributeChange("gaugeGradient", render),
      chart.onAttributeChange("gaugeLineWidth", render),
      chart.onAttributeChange("staticZones", () => chart.reconcileChartLibrary()),
      chart.onAttributeChange("theme", () => {
        updateColors()
        render()
      })
    )
  }

  const unmount = () => {
    listeners?.()
    listeners = null
    resource?.destroy()
    resource = null
    colors = null
    prevMin = null
    prevMax = null
    drawStats = null
  }

  const render = frame => {
    if (!resource || !chart.getAttribute("loaded")) return false
    const gaugeFrame = makeGaugeFrame(chart, { ...frame, colors })
    if (!gaugeFrame) return false

    const { min, max } = gaugeFrame
    if (min !== prevMin || max !== prevMax) chart.trigger("yAxisChange", min, max)
    prevMin = min
    prevMax = max

    resource.layer.update(gaugeFrame)
    resource.surface.draw([resource.layer], frame)
    drawStats = {
      value: gaugeFrame.value,
      percentage: gaugeFrame.percentage,
      radius: gaugeFrame.radius,
      lineWidth: gaugeFrame.lineWidth,
      progressSweep: gaugeFrame.progressSweep,
    }
    return true
  }

  return {
    mount,
    unmount,
    render,
    createResources: (runtime, canvas) => makeResources(runtime, canvas),
    attachResources: nextResource => {
      resource?.destroy()
      resource = nextResource
    },
    getBufferBytes: () => resource?.layer.getBufferBytes() || 0,
    getDrawStats: () => drawStats,
    getQueueDone: () => resource?.surface.getQueueDone?.() || Promise.resolve(),
    getMinMax: () => chart.getAttribute("getValueRange")(chart),
  }
}
