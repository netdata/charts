export default (a, b, pixels, opts, dygraph, vals) => {
  const pixelsPerTick = opts("pixelsPerLabel")
  let ticks = []
  let i, j, tickV, nTicks

  if (vals) {
    for (i = 0; i < vals.length; i++) {
      ticks.push({ v: vals[i] })
    }
  } else {
    if (ticks.length === 0) {
      const mults = [1, 2, 5, 10, 20, 50, 100]
      const base = 10

      // Get the maximum number of permitted ticks based on the
      // graph's pixel size and pixelsPerTick setting.
      var maxTicks = Math.ceil(pixels / pixelsPerTick)

      // Now calculate the data unit equivalent of this tick spacing.
      // Use abs() since graphs may have a reversed Y axis.
      const unitsPerTick = Math.abs(b - a) / maxTicks

      // Based on this, get a starting scale which is the largest
      // integer power of the chosen base (10 or 16) that still remains
      // below the requested pixelsPerTick spacing.
      const basePower = Math.floor(Math.log(unitsPerTick) / Math.log(base))
      const baseScale = Math.pow(base, basePower)

      // Now try multiples of the starting scale until we find one
      // that results in tick marks spaced sufficiently far apart.
      // The "mults" array should cover the range 1 .. base^2 to
      // adjust for rounding and edge effects.
      let scale, low_val, high_val, spacing
      for (j = 0; j < mults.length; j++) {
        scale = baseScale * mults[j]
        low_val = Math.floor(a / scale) * scale
        high_val = Math.ceil(b / scale) * scale
        nTicks = Math.abs(high_val - low_val) / scale
        spacing = pixels / nTicks
        if (spacing > pixelsPerTick) break
      }

      // Construct the set of ticks.
      // Allow reverse y-axis if it's explicitly requested.
      if (low_val > high_val) scale *= -1

      for (i = 0; i <= nTicks; i++) {
        tickV = low_val + i * scale
        ticks.push({ v: tickV })
      }
    }
  }

  const formatter = opts("axisLabelFormatter")

  // Add labels to the ticks.
  for (i = 0; i < ticks.length; i++) {
    if (ticks[i].label !== undefined) continue // Use current label.
    ticks[i].label = formatter.call(dygraph, ticks[i].v, 0, opts, dygraph)
  }
  const [min, max] = dygraph.yAxisRange(0)
  const pointHeight = (max - min) / 15 / dygraph.getArea().h

  return [
    { label_v: max - pointHeight, label: "AR %" },
    ...ticks.filter(
      tick => dygraph.toPercentYCoord(tick.v, 0) < 0.92 && dygraph.toPercentYCoord(tick.v, 0) > 0.08
    ),
    { label_v: min + pointHeight, label: "Annotations" },
  ]
}
