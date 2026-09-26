import { makeCrosshairRects } from "../interaction"
import { makeOverlayRects } from "../overlays"
import { makeDataDecorationRects } from "./decorations"
import { shouldIncludeZero } from "./config"

export default ({
  chart,
  chartUI,
  packedData,
  getResource,
  getLocalDateWindow,
  getSelectionRect,
  forceIncludeZero,
  makeSeriesStyle,
  getPackedVisibleRange,
  makeMarkers,
  makeColors,
  makeAxes,
  getValueRangeOverride,
  getAxisDimensionIds,
  getYAxisNotificationRange,
}) => {
  let lastPacked = null
  let lastFrame = null
  let lastAxesKey = null
  let lastAxes = null
  let lastOverlayKey = null
  let lastYAxisRange = null
  let colors = null
  let colorsDirty = true

  const markColorsDirty = () => {
    colorsDirty = true
  }

  const reset = () => {
    lastPacked = null
    lastFrame = null
    lastAxesKey = null
    lastAxes = null
    lastOverlayKey = null
    lastYAxisRange = null
    colors = null
    colorsDirty = true
  }

  const getValueRange = (packed, afterMs, beforeMs) => {
    if (getValueRangeOverride)
      return getValueRangeOverride({ chart, packed, afterMs, beforeMs })

    const getRange = chart.getAttribute("getValueRange")
    const range = typeof getRange === "function" ? getRange(chart) : null
    let min = range?.[0] ?? chart.getAttribute("min")
    let max = range?.[1] ?? chart.getAttribute("max")
    const { staticValueRange, valueRange } = chart.getAttributes()
    const autoRange =
      !staticValueRange &&
      (!valueRange || (valueRange[0] === null && valueRange[1] === null))

    if (autoRange) {
      const indexes = new Map(
        chart.getPayloadDimensionIds().map((id, index) => [id, index])
      )
      const seriesIndexes = chart
        .getVisibleDimensionIds()
        .map(id => indexes.get(id))
        .filter(index => index !== undefined)
      const visibleRange = getPackedVisibleRange({
        packed,
        afterMs,
        beforeMs,
        seriesIndexes,
      })
      if (visibleRange) [min, max] = visibleRange
    }
    const includeZero = shouldIncludeZero({
      includeZero: chart.getAttribute("includeZero"),
      forceIncludeZero,
      dimensionCount: chart.getPayloadDimensionIds().length,
      selectedDimensionCount: chart.getAttribute("selectedLegendDimensions").length,
    })
    if (includeZero) {
      min = Math.min(0, min)
      max = Math.max(0, max)
    }
    return [min, max]
  }

  const getAxesKey = ({ width, height, dpr, min, max, afterMs, beforeMs }) => {
    const attributes = chart.getAttributes()
    const dimensionIds = getAxisDimensionIds(chart)
    return JSON.stringify([
      width,
      height,
      dpr,
      min,
      max,
      afterMs,
      beforeMs,
      attributes.sparkline,
      attributes.enabledXAxis,
      attributes.enabledYAxis,
      attributes.yAxisLabelWidth,
      attributes.axisLabelFontSize,
      attributes.theme,
      attributes.timezone,
      attributes.locale,
      attributes.secondsAsTime,
      attributes.desiredUnits,
      attributes.staticFractionDigits,
      attributes.unitsConversionMethod,
      dimensionIds,
      dimensionIds.map(id => chart.getDimensionUnit(id)),
    ])
  }

  const notifyYAxisRange = ({ packed, min, max }) => {
    const [notificationMin, notificationMax] = getYAxisNotificationRange({
      chart,
      packed,
      min,
      max,
    })
    if (
      lastYAxisRange &&
      lastYAxisRange[0] === notificationMin &&
      lastYAxisRange[1] === notificationMax
    )
      return

    lastYAxisRange = [notificationMin, notificationMax]
    chart.trigger("yAxisChange", notificationMin, notificationMax)
  }

  const render = ({ width, height, dpr }) => {
    const resource = getResource()
    if (!resource || chart.getAttribute("processing")) return false

    const packed = packedData.get()
    if (!packed) {
      resource.surface.draw([], { width, height, dpr })
      return true
    }

    const dataChanged = packed !== lastPacked
    if (dataChanged) colorsDirty = true
    if (colorsDirty) colors = makeColors(chart)

    const [afterMs, beforeMs] = getLocalDateWindow() || chart.getDateWindow()
    const [min, max] = getValueRange(packed, afterMs, beforeMs)
    const axesKey = getAxesKey({ width, height, dpr, min, max, afterMs, beforeMs })
    const axesChanged = axesKey !== lastAxesKey
    const axes = axesChanged
      ? makeAxes({ chart, width, height, min, max, afterMs, beforeMs })
      : lastAxes

    notifyYAxisRange({ packed, min, max })
    if (axesChanged)
      resource.grid.update({ rects: axes.rects, width, height, dpr })
    if (axesChanged || resource.text.needsUpdate())
      resource.text.update({ labels: axes.labels, width, height, dpr })

    lastFrame = { plot: axes.plot, domain: axes.domain, afterMs, beforeMs }
    const overlayKey = JSON.stringify([
      chart.getAttribute("overlays"),
      chart.getAttribute("draftAnnotation"),
      chart.getAttribute("showAnomalies"),
      chart.getAttribute("showAnnotations"),
      chart.getAttribute("selectedLegendDimensions"),
      chart.getAttribute("theme"),
      chart.getAttribute("outOfLimits"),
      chart.getAttribute("error"),
      chart.getFirstEntry(),
      lastFrame,
    ])
    if (dataChanged || overlayKey !== lastOverlayKey)
      resource.overlay.update({
        rects: [
          ...makeOverlayRects({ chart, chartUI, frame: lastFrame }),
          ...makeDataDecorationRects({ chart, frame: lastFrame }),
        ],
        width,
        height,
        dpr,
      })

    resource.interaction.update({
      rects: [
        ...makeCrosshairRects(chart, lastFrame),
        ...(getSelectionRect() ? [getSelectionRect()] : []),
      ],
      width,
      height,
      dpr,
    })
    if (dataChanged || axesChanged || colorsDirty)
      resource.marker.update({
        circles: makeMarkers({ chart, packed, frame: lastFrame }),
        width,
        height,
        dpr,
        plot: axes.plot,
      })

    resource.line.update({
      packed,
      colors,
      dataChanged,
      colorsChanged: colorsDirty,
      afterMs,
      beforeMs,
      min: axes.domain[0],
      max: axes.domain[1],
      width,
      height,
      dpr,
      plot: axes.plot,
      ...makeSeriesStyle(chart, { packed, frame: lastFrame }),
    })
    resource.surface.draw(
      [
        resource.grid,
        resource.overlay,
        resource.line,
        resource.marker,
        resource.interaction,
        resource.text,
      ],
      { width, height, dpr }
    )

    lastPacked = packed
    lastAxesKey = axesKey
    lastAxes = axes
    lastOverlayKey = overlayKey
    colorsDirty = false
    return true
  }

  return {
    getFrame: () => lastFrame,
    markColorsDirty,
    render,
    reset,
  }
}
