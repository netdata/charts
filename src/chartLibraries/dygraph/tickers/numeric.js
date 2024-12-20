import { isBinary } from "@/helpers/units"

const anomalySVG = `<div title="Anomaly detection percent (%)"><svg width="15" height="16" view-box="0 0 15 16" xmlns="http://www.w3.org/2000/svg" fill="#B596F8" fill-opacity="0.4" transform="translate(18, -1) scale(0.6)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M13.228 3.29597L8.522 0.578973C8.167 0.373973 7.771 0.271973 7.375 0.271973C6.979 0.271973 6.583 0.373973 6.228 0.578973L1.522 3.29597C0.812 3.70597 0.375 4.46297 0.375 5.28297V10.718C0.375 11.537 0.812 12.295 1.522 12.704L6.228 15.421C6.583 15.626 6.979 15.728 7.375 15.728C7.771 15.728 8.167 15.626 8.522 15.421L13.228 12.704C13.938 12.294 14.375 11.537 14.375 10.718V5.28297C14.375 4.46297 13.938 3.70597 13.228 3.29597ZM7.97949 4.76094L7.37505 3.23265L6.7706 4.76094L4.93313 9.40688H4.37505H1.37505V10.7069H4.37505H5.37505H5.81696L5.97949 10.2959L7.37505 6.76735L8.7706 10.2959L9.26618 11.549L9.93839 10.3811L10.375 9.62253L10.8117 10.3811L10.9992 10.7069H11.375H13.375V9.40688H11.7509L10.9384 7.99531L10.375 7.01662L9.8117 7.99531L9.48391 8.56479L7.97949 4.76094Z" />
</svg></div>`

export default (a, b, pixels, opts, dygraph, vals, { units } = {}) => {
  const pixelsPerTick = opts("pixelsPerLabel")
  let ticks = []
  let i, j, tickV, nTicks

  if (vals) {
    for (i = 0; i < vals.length; i++) {
      ticks.push({ v: vals[i] })
    }
  } else {
    if (ticks.length === 0) {
      const mults = isBinary(units[0])
        ? [1, 2, 4, 8, 16, 32, 64, 128, 256]
        : [1, 2, 5, 10, 20, 50, 100]
      const base = isBinary(units[0]) ? 1024 : 10

      // Get the maximum number of permitted ticks based on the
      // graph's pixel size and pixelsPerTick setting.
      const maxTicks = Math.ceil(pixels / pixelsPerTick)

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

  const formatLabel = opts("axisLabelFormatter")

  // Add labels to the ticks.
  for (i = 0; i < ticks.length; i++) {
    if (ticks[i].label !== undefined) continue // Use current label.
    ticks[i].label = formatLabel(ticks[i].v, 0, opts, dygraph)
  }
  const [min, max] = dygraph.yAxisRange(0)
  const pointHeight = (max - min) / 15 / dygraph.getArea().h

  return [
    { label_v: max - pointHeight, label: anomalySVG },
    ...ticks.filter(
      tick => dygraph.toPercentYCoord(tick.v, 0) < 0.92 && dygraph.toPercentYCoord(tick.v, 0) > 0.08
    ),
    { label_v: min + pointHeight, label: "" },
  ]
}
