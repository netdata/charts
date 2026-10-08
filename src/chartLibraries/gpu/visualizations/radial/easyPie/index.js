import { parseColor } from "@/chartLibraries/gpu/color"
import makeSimpleVisualization from "../makeSimpleVisualization"

const clampPercentage = percentage =>
  Math.min(Math.max(-1, percentage / 100 || 0), 1)

export const getEasyPieValue = chart => {
  const { data } = chart.getPayload()
  if (data?.length === undefined) return undefined

  const hoverX = chart.getAttribute("hoverX")
  const row = hoverX ? chart.getClosestRow(hoverX[0]) : data.length - 1
  const rowData = data[row]
  if (!Array.isArray(rowData)) return null

  return rowData.slice(1).reduce((sum, value = 0) => sum + value, 0)
}

export const makeEasyPieFrame = (
  chart,
  { width, height, dpr, colors },
  value = getEasyPieValue(chart)
) => {
  if (value == null) return null

  const [min, max] = chart.getAttribute("getValueRange")(chart)
  const percentage = ((value - min) / (max - min)) * 100
  const cssSize = Math.min(width, height)
  const size = Math.max(20, cssSize)
  const multiplier = cssSize / 22
  const lineWidth = multiplier < 4 ? 2 : Math.floor(multiplier)
  const scaleLength = multiplier < 4 ? 2 : Math.floor(multiplier)
  const scaleEnabled = Boolean(colors.scale)
  const trackEnabled = Boolean(colors.track)
  const radius =
    (size - lineWidth) / 2 - (scaleEnabled && scaleLength ? scaleLength + 2 : 0)

  return {
    width,
    height,
    dpr,
    centerX: (width * dpr) / 2,
    centerY: (height * dpr) / 2,
    size: size * dpr,
    radius: radius * dpr,
    lineWidth: lineWidth * dpr,
    scaleLength: scaleLength * dpr,
    sweep: clampPercentage(percentage),
    scaleEnabled,
    trackEnabled,
    barColor: parseColor(colors.bar),
    trackColor: parseColor(colors.track),
    scaleColor: parseColor(colors.scale),
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
      bar: target.selectDimensionColor(),
      track: target.getThemeAttribute("themeEasyPieTrackColor"),
      scale: target.getThemeAttribute("themeEasyPieScaleColor"),
    }),
    makeFrame: ({ chart: target, frame }) => {
      const value = getEasyPieValue(target)
      if (value === undefined) return false
      if (value === null) return true
      return makeEasyPieFrame(target, frame, value)
    },
    makeDrawStats: frame => ({
      value: frame.value,
      percentage: frame.percentage,
      sweep: frame.sweep,
      size: frame.size,
      radius: frame.radius,
      lineWidth: frame.lineWidth,
      scaleLength: frame.scaleLength,
    }),
  })
