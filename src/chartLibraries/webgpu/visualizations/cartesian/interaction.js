const xPosition = (timestampMs, afterMs, beforeMs, plot) =>
  plot.left + ((timestampMs - afterMs) / Math.max(beforeMs - afterMs, 1e-20)) * plot.width

export const makeVerticalDashRects = ({ x, plot, color, dash = [5, 5] }) => {
  const [draw, skip] = dash
  const rects = []
  const bottom = plot.top + plot.height
  for (let y = plot.top; y < bottom; y += draw + skip) {
    rects.push({ x, y, width: 1, height: Math.min(draw, bottom - y), color })
  }
  return rects
}

export const makeCrosshairRects = (chart, frame) => {
  const clickX = chart.getAttribute("clickX")
  const hoverX = chart.getAttribute("hoverX")
  const dimensions = Array.isArray(clickX) ? clickX : hoverX
  if (!Array.isArray(dimensions) || !Number.isFinite(dimensions[0])) return []

  const click = dimensions === clickX
  const x = xPosition(dimensions[0], frame.afterMs, frame.beforeMs, frame.plot)
  if (x < frame.plot.left || x > frame.plot.left + frame.plot.width) return []

  return makeVerticalDashRects({
    x,
    plot: frame.plot,
    color: chart.getThemeAttribute(click ? "themeNetdata" : "themeCrosshair"),
    dash: click ? [2, 2] : [5, 5],
  })
}
