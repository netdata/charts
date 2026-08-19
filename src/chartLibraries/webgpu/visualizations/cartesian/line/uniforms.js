const uniformByteLength = 80

export const makeUniformData = ({
  packed,
  drawLayout,
  domain,
  plot,
  canvas,
  fill,
}) => {
  const data = new ArrayBuffer(uniformByteLength)
  const floats = new Float32Array(data)
  const integers = new Uint32Array(data)

  floats.set([
    domain.after,
    domain.before,
    domain.minimum,
    domain.maximum,
    plot.left,
    plot.top,
    plot.width,
    plot.height,
    canvas.width,
    canvas.height,
    canvas.lineWidth,
    canvas.mode,
    fill.baseline,
    fill.opacity,
    fill.mode,
    fill.heatmapMaximum,
  ])
  integers.set(
    [
      packed.pointCount,
      packed.seriesCount,
      drawLayout.segmentsPerPair,
      drawLayout.segmentsPerSeries,
    ],
    16
  )
  return data
}

export const makeScissor = ({ plot, canvas }) => ({
  left: Math.min(plot.left, canvas.width - 1),
  top: Math.min(plot.top, canvas.height - 1),
  width: Math.max(1, Math.min(plot.width, canvas.width - plot.left)),
  height: Math.max(1, Math.min(plot.height, canvas.height - plot.top)),
})

export { uniformByteLength }
