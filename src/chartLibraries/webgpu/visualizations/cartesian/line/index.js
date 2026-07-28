import { unregister } from "@/helpers/makeListeners"
import makeSurface from "@/chartLibraries/webgpu/engine/surface"
import makeCircleLayer from "@/chartLibraries/webgpu/primitives/circle"
import makeRectLayer from "@/chartLibraries/webgpu/primitives/rect"
import makeTextLayer from "@/chartLibraries/webgpu/text"
import { makeCartesianAxes, makePlotArea } from "../axes"
import { makeCrosshairRects } from "../interaction"
import { makeOverlayRects } from "../overlays"
import makeInteractions from "./interactions"
import { makeDataDecorationRects, makeGapEdgeCircles } from "./decorations"
import makePackedData from "./data"
import makeKernel from "./kernel"
import { getVisibleRange } from "./range"
import { makeSeriesColors } from "./colors"

export default ({ chart, chartUI }) => {
  const packedData = makePackedData(chart)
  let resource = null
  let listeners = null
  let offInteractions = null
  let lastPacked = null
  let lastFrame = null
  let lastAxesKey = null
  let lastAxes = null
  let lastOverlayKey = null
  let lastYAxisRange = null
  let localDateWindow = null
  let selectionRect = null
  let colors = null
  let colorsDirty = true

  const markColorsDirty = render => () => {
    colorsDirty = true
    render()
  }

  const mount = ({ render, canvas }) => {
    offInteractions = makeInteractions({
      chart,
      chartUI,
      canvas,
      getFrame: () => lastFrame,
      setDateWindow: dateWindow => {
        localDateWindow = dateWindow
        render()
      },
      clearDateWindow: () => {
        localDateWindow = null
        render()
      },
      setSelectionRect: rect => {
        selectionRect = rect
        render()
      },
    })
    listeners = unregister(
      chart.on("visibleDimensionsChanged", markColorsDirty(render)),
      chart.onAttributeChange("selectedLegendDimensions", markColorsDirty(render)),
      chart.onAttributeChange("colors", markColorsDirty(render)),
      chart.onAttributeChange("theme", markColorsDirty(render)),
      chart.onAttributeChange("stepPlot", render),
      chart.onAttributeChange("staticValueRange", render),
      chart.onAttributeChange("valueRange", render),
      chart.onAttributeChange("getValueRange", render),
      chart.onAttributeChange("min", render),
      chart.onAttributeChange("max", render),
      chart.onAttributeChange("includeZero", render),
      chart.onAttributeChange("enabledXAxis", render),
      chart.onAttributeChange("enabledYAxis", render),
      chart.onAttributeChange("yAxisLabelWidth", render),
      chart.onAttributeChange("axisLabelFontSize", render),
      chart.onAttributeChange("timezone", render),
      chart.onAttributeChange("locale", render),
      chart.onAttributeChange("secondsAsTime", render),
      chart.onAttributeChange("desiredUnits", render),
      chart.onAttributeChange("staticFractionDigits", render),
      chart.onAttributeChange("unitsConversionMethod", render),
      chart.onAttributeChange("showAnomalies", render),
      chart.onAttributeChange("showAnnotations", render),
      chart.onAttributeChange("outOfLimits", render),
      chart.onAttributeChange("error", render),
      chart.onAttributeChange("processing", render),
      chart.onAttributeChange("hoverX", render),
      chart.onAttributeChange("clickX", render),
      chart.onAttributeChange("overlays", render),
      chart.onAttributeChange("draftAnnotation", render),
      chart.onAttributeChange("after", () => {
        localDateWindow = null
        render()
      }),
      chart.onAttributeChange("before", () => {
        localDateWindow = null
        render()
      })
    )
  }

  const unmount = () => {
    listeners?.()
    listeners = null
    offInteractions?.()
    offInteractions = null
    resource?.destroy()
    resource = null
    packedData.clear()
    lastPacked = null
    lastFrame = null
    lastAxesKey = null
    lastAxes = null
    lastOverlayKey = null
    lastYAxisRange = null
    localDateWindow = null
    selectionRect = null
    colors = null
    colorsDirty = true
  }

  const createGPU = async (runtime, canvas) => {
    const surface = makeSurface(runtime, canvas)
    let grid = null
    let interaction = null
    let overlay = null
    let line = null
    let marker = null
    let text = null
    try {
      grid = await makeRectLayer(runtime, surface, "grid")
      interaction = await makeRectLayer(runtime, surface, "interaction")
      overlay = await makeRectLayer(runtime, surface, "overlay")
      line = await makeKernel(runtime, surface)
      marker = await makeCircleLayer(runtime, surface)
      text = await makeTextLayer(runtime, surface)
      return {
        surface,
        grid,
        interaction,
        overlay,
        line,
        marker,
        text,
        destroy: () => {
          grid.destroy()
          interaction.destroy()
          overlay.destroy()
          line.destroy()
          marker.destroy()
          text.destroy()
          surface.destroy()
        },
      }
    } catch (error) {
      grid?.destroy()
      interaction?.destroy()
      overlay?.destroy()
      line?.destroy()
      marker?.destroy()
      text?.destroy()
      surface.destroy()
      throw error
    }
  }

  const attachGPU = nextResource => {
    resource?.destroy()
    resource = nextResource
  }

  const getValueRange = (packed, afterMs, beforeMs) => {
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
      const visibleRange = getVisibleRange({ packed, afterMs, beforeMs, seriesIndexes })
      if (visibleRange) [min, max] = visibleRange
    }
    if (chart.getAttribute("includeZero")) {
      min = Math.min(0, min)
      max = Math.max(0, max)
    }
    return [min, max]
  }

  const getAxesKey = ({ width, height, dpr, min, max, afterMs, beforeMs }) => {
    const attributes = chart.getAttributes()
    const dimensionIds = chart.getVisibleDimensionIds()
    return JSON.stringify([
      width,
      height,
      dpr,
      min,
      max,
      afterMs,
      beforeMs,
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

  const render = ({ width, height, dpr }) => {
    if (!resource) return false

    if (chart.getAttribute("processing")) return false

    const packed = packedData.get()
    if (!packed) {
      resource.surface.draw([], { width, height, dpr })
      return true
    }

    const dataChanged = packed !== lastPacked
    if (dataChanged) colorsDirty = true
    if (colorsDirty) colors = makeSeriesColors(chart)

    const [afterMs, beforeMs] = localDateWindow || chart.getDateWindow()
    const [min, max] = getValueRange(packed, afterMs, beforeMs)
    const axesKey = getAxesKey({ width, height, dpr, min, max, afterMs, beforeMs })
    const axesChanged = axesKey !== lastAxesKey
    const axes = axesChanged
      ? makeCartesianAxes({ chart, width, height, min, max, afterMs, beforeMs })
      : lastAxes
    if (!lastYAxisRange || lastYAxisRange[0] !== min || lastYAxisRange[1] !== max) {
      lastYAxisRange = [min, max]
      chart.trigger("yAxisChange", min, max)
    }
    if (axesChanged) resource.grid.update({ rects: axes.rects, width, height, dpr })
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
        ...(selectionRect ? [selectionRect] : []),
      ],
      width,
      height,
      dpr,
    })
    if (dataChanged || axesChanged || colorsDirty)
      resource.marker.update({
        circles: makeGapEdgeCircles({ chart, packed, frame: lastFrame }),
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
      lineWidth: 1.5,
      stepped: chart.getAttribute("stepPlot"),
      smooth: !chart.getAttribute("stepPlot"),
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

  const getPlotArea = () =>
    makePlotArea(chart, chartUI.getChartWidth(), chartUI.getChartHeight())
  const getXAxisRange = () => localDateWindow || chart.getDateWindow()
  const getXCoord = timestampMs => {
    const [after, before] = getXAxisRange()
    const plot = getPlotArea()
    return before === after
      ? plot.left
      : plot.left + ((timestampMs - after) / (before - after)) * plot.width
  }

  return {
    mount,
    unmount,
    createGPU,
    attachGPU,
    render,
    getPlotArea,
    getXAxisRange,
    getXCoord,
    getQueueDone: () => resource?.surface.getQueueDone(),
    getBufferBytes: () =>
      resource
        ? resource.grid.getBufferBytes() +
          resource.interaction.getBufferBytes() +
          resource.overlay.getBufferBytes() +
          resource.line.getBufferBytes() +
          resource.marker.getBufferBytes() +
          resource.text.getBufferBytes()
        : 0,
  }
}
