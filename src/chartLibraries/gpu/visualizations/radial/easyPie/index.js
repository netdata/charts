import { parseColor } from "@/chartLibraries/gpu/color"
import { unregister } from "@/helpers/makeListeners"

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

export default ({ chart, makeResources }) => {
  let resource = null
  let listeners = null
  let colors = null
  let prevMin
  let prevMax
  let drawStats = null

  const updateColors = () => {
    colors = {
      bar: chart.selectDimensionColor(),
      track: chart.getThemeAttribute("themeEasyPieTrackColor"),
      scale: chart.getThemeAttribute("themeEasyPieScaleColor"),
    }
  }

  const mount = ({ render }) => {
    updateColors()
    const { loaded } = chart.getAttributes()
    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render),
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
    const value = getEasyPieValue(chart)
    if (value === undefined) return false
    if (value === null) return true
    const easyPieFrame = makeEasyPieFrame(chart, { ...frame, colors }, value)

    const { min, max } = easyPieFrame
    if (min !== prevMin || max !== prevMax) chart.trigger("yAxisChange", min, max)
    prevMin = min
    prevMax = max

    resource.layer.update(easyPieFrame)
    resource.surface.draw([resource.layer], frame)
    drawStats = {
      value: easyPieFrame.value,
      percentage: easyPieFrame.percentage,
      sweep: easyPieFrame.sweep,
      size: easyPieFrame.size,
      radius: easyPieFrame.radius,
      lineWidth: easyPieFrame.lineWidth,
      scaleLength: easyPieFrame.scaleLength,
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
  }
}
