import { makeCurveSegments, makeDrawLayout } from "./geometry"

const normalizeRange = (minimum, maximum) => {
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) return [-1, 1]
  if (minimum !== maximum) return [minimum, maximum]
  const padding = Math.abs(minimum || 1) * 0.01
  return [minimum - padding, maximum + padding]
}

export default ({
  packed,
  fillMode,
  afterMs,
  beforeMs,
  minimum,
  maximum,
  width,
  height,
  dpr,
  plot = { left: 0, top: 0, width, height },
  fillAlpha = 0,
  lineWidth,
  barWidth = 0,
  heatmapMaximum = 0,
  stepped,
  smooth,
}) => {
  const isMultiBar = fillMode === "multiBar"
  const isHeatmap = fillMode === "heatmap"
  const isBar = fillMode === "stackedBar" || isMultiBar || isHeatmap
  const usesStackedData = fillMode === "stacked" || fillMode === "stackedBar"
  const canvas = {
    width: Math.max(1, Math.round(width * dpr)),
    height: Math.max(1, Math.round(height * dpr)),
    lineWidth: lineWidth * dpr,
    mode: stepped ? 1 : smooth ? 2 : 0,
  }
  const physicalPlot = {
    left: Math.max(0, Math.round(plot.left * dpr)),
    top: Math.max(0, Math.round(plot.top * dpr)),
    width: Math.max(1, Math.round(plot.width * dpr)),
    height: Math.max(1, Math.round(plot.height * dpr)),
  }
  const drawLayout = isBar
    ? {
        instanceCount: packed.pointCount * packed.seriesCount,
        fillInstanceCount: packed.pointCount * packed.seriesCount,
        strokeInstanceCount: 0,
        segmentsPerPair: 0,
        segmentsPerSeries: 0,
      }
    : makeDrawLayout({
        pointCount: packed.pointCount,
        seriesCount: packed.seriesCount,
        stepped,
        smooth,
        curveSegments: makeCurveSegments({
          pointCount: packed.pointCount,
          plotWidth: physicalPlot.width,
        }),
        filled: Boolean(fillMode && fillAlpha > 0),
        stroke: lineWidth > 0,
      })
  const [rangeMinimum, rangeMaximum] = normalizeRange(minimum, maximum)

  return {
    canvas,
    plot: physicalPlot,
    domain: {
      after: (afterMs - packed.xOriginMs) / 1000,
      before: (beforeMs - packed.xOriginMs) / 1000,
      minimum: (rangeMinimum - packed.yOrigin) / packed.yScale,
      maximum: (rangeMaximum - packed.yOrigin) / packed.yScale,
    },
    fill: {
      baseline: isBar
        ? barWidth * dpr
        : (0 - packed.yOrigin) / packed.yScale,
      opacity: isMultiBar
        ? (0 - packed.yOrigin) / packed.yScale
        : fillAlpha,
      mode: usesStackedData ? 1 : isMultiBar ? 2 : isHeatmap ? 3 : 0,
      heatmapMaximum: isHeatmap ? heatmapMaximum : 0,
    },
    counts: {
      points: packed.pointCount,
      series: packed.seriesCount,
      segmentsPerPair: drawLayout.segmentsPerPair,
      segmentsPerSeries: drawLayout.segmentsPerSeries,
    },
    drawLayout,
    ...drawLayout,
    drawStats: {
      pointCount: packed.pointCount,
      seriesCount: packed.seriesCount,
      sourcePairs: Math.max(0, packed.pointCount - 1) * packed.seriesCount,
      barInstanceCount: isBar
        ? packed.pointCount * packed.seriesCount
        : 0,
      barWidth: isBar ? barWidth : null,
      valueRange: [minimum, maximum],
      ...drawLayout,
    },
    flags: { isBar, isHeatmap, isMultiBar, usesStackedData },
    fillPass: fillMode === "stacked" ? 3 : isBar ? 4 : 2,
  }
}
