export default ({
  frame,
  textureStates,
  usesStackedData,
  isMultiBar,
  isHeatmap,
}) => ({
  uXValues: 0,
  uYValues: 1,
  uSeriesColors: 2,
  ...((usesStackedData || isMultiBar) && { uBaseValues: 3 }),
  uXTextureSize: [textureStates.x.width, textureStates.x.height],
  uYTextureSize: [textureStates.y.width, textureStates.y.height],
  uColorTextureSize: [
    textureStates.color.width,
    textureStates.color.height,
  ],
  ...(usesStackedData && {
    uBaseTextureSize: [
      textureStates.base.width,
      textureStates.base.height,
    ],
  }),
  ...(isMultiBar && {
    uBaseTextureSize: [textureStates.y.width, textureStates.y.height],
  }),
  uDomain: [
    frame.domain.after,
    frame.domain.before,
    frame.domain.minimum,
    frame.domain.maximum,
  ],
  uPlot: [
    frame.plot.left,
    frame.plot.top,
    frame.plot.width,
    frame.plot.height,
  ],
  uCanvas: [
    frame.canvas.width,
    frame.canvas.height,
    frame.canvas.lineWidth,
    frame.canvas.mode,
  ],
  uFill: [
    frame.fill.baseline,
    frame.fill.opacity,
    frame.fill.mode,
    ...(isHeatmap ? [frame.fill.heatmapMaximum] : []),
  ],
  uCounts: [
    frame.counts.points,
    frame.counts.series,
    frame.counts.segmentsPerPair,
    frame.counts.segmentsPerSeries,
  ],
})
