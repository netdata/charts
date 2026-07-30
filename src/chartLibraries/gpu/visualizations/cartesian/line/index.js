import { unregister } from "@/helpers/makeListeners"
import { makeCartesianAxes, makePlotArea } from "../axes"
import makeInteractions from "./interactions"
import { makeGapEdgeCircles } from "./decorations"
import makeDefaultPackedData from "./data"
import { getVisibleRange as getDefaultVisibleRange } from "./range"
import { makeSeriesColors } from "./colors"
import { makeLineStyle } from "./config"
import makeFrameRenderer from "./makeFrameRenderer"

export default ({
  chart,
  chartUI,
  makeResources,
  forceIncludeZero = false,
  makeSeriesStyle = makeLineStyle,
  makePackedData = makeDefaultPackedData,
  getPackedVisibleRange = getDefaultVisibleRange,
  findDimension,
  makeMarkers = makeGapEdgeCircles,
  makeColors = makeSeriesColors,
  makeAxes = makeCartesianAxes,
  getValueRangeOverride,
  getAxisDimensionIds = targetChart => targetChart.getVisibleDimensionIds(),
  getYAxisNotificationRange = ({ min, max }) => [min, max],
}) => {
  const packedData = makePackedData(chart)
  let resource = null
  let listeners = null
  let offInteractions = null
  let localDateWindow = null
  let selectionRect = null

  const frameRenderer = makeFrameRenderer({
    chart,
    chartUI,
    packedData,
    getResource: () => resource,
    getLocalDateWindow: () => localDateWindow,
    getSelectionRect: () => selectionRect,
    forceIncludeZero,
    makeSeriesStyle,
    getPackedVisibleRange,
    makeMarkers,
    makeColors,
    makeAxes,
    getValueRangeOverride,
    getAxisDimensionIds,
    getYAxisNotificationRange,
  })

  const markColorsDirty = render => () => {
    frameRenderer.markColorsDirty()
    render()
  }

  const mount = ({ render, canvas }) => {
    offInteractions = makeInteractions({
      chart,
      chartUI,
      canvas,
      getFrame: frameRenderer.getFrame,
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
      findDimension,
    })
    listeners = unregister(
      chart.on("visibleDimensionsChanged", markColorsDirty(render)),
      chart.onAttributeChange("selectedLegendDimensions", markColorsDirty(render)),
      chart.onAttributeChange("colors", markColorsDirty(render)),
      chart.onAttributeChange("theme", markColorsDirty(render)),
      chart.onAttributeChange("stepPlot", render),
      chart.onAttributeChange("heatmapType", render),
      chart.onAttributeChange("staticValueRange", render),
      chart.onAttributeChange("valueRange", render),
      chart.onAttributeChange("getValueRange", render),
      chart.onAttributeChange("min", render),
      chart.onAttributeChange("max", render),
      chart.onAttributeChange("includeZero", render),
      chart.onAttributeChange("sparkline", render),
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
    frameRenderer.reset()
    localDateWindow = null
    selectionRect = null
  }

  const createResources = (runtime, canvas, onLost) =>
    makeResources(runtime, canvas, onLost)

  const attachResources = nextResource => {
    resource?.destroy()
    resource = nextResource
  }

  const render = frameRenderer.render

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
    createResources,
    attachResources,
    render,
    getPlotArea,
    getXAxisRange,
    getXCoord,
    getQueueDone: () => resource?.surface.getQueueDone(),
    getDrawStats: () => resource?.line.getDrawStats?.() || null,
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
