import { parseColor } from "@/chartLibraries/gpu/color"
import { UnsupportedVisualizationConfigurationError } from "@/chartLibraries/gpu/errors"
import makeSimpleVisualization from "../makeSimpleVisualization"
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

export default ({ chart, makeResources }) =>
  makeSimpleVisualization({
    chart,
    makeResources,
    makeColors: target => ({
      dimension: target.selectDimensionColor(),
      pointer: target.getThemeAttribute("themeGaugePointer"),
      track: target.getThemeAttribute("themeGaugeStroke"),
    }),
    makeFrame: ({ chart: target, frame }) =>
      makeGaugeFrame(target, frame) || false,
    makeDrawStats: frame => ({
      value: frame.value,
      percentage: frame.percentage,
      radius: frame.radius,
      lineWidth: frame.lineWidth,
      progressSweep: frame.progressSweep,
    }),
    watchedAttributes: [
      "gaugeThresholds",
      "gaugeGradient",
      "gaugeLineWidth",
    ],
    makeExtraListeners: ({ chart: target }) => [
      target.onAttributeChange("staticZones", () =>
        target.reconcileRenderer()
      ),
    ],
    getMinMax: target => target.getAttribute("getValueRange")(target),
  })
