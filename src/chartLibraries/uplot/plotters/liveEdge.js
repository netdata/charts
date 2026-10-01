import getPxRatio from "../pxRatio"

export const dotRadius = 3.5
export const haloRadius = 8
export const haloAlpha = 0.22
export const glowBlur = 10
export const maxGlowSeries = 8

const glowChartTypes = { line: true, area: true }

// the "live" legend layout is resolved (and capped by series count) by the modern legend body
export const isLiveLayout = chart =>
  chart.getAttribute("designFlavour") === "modern" &&
  chart.getAttribute("legendMode") === "live" &&
  !chart.isSparkline() &&
  !!glowChartTypes[chart.getAttribute("chartType")]

export const isFollowingNow = chart =>
  chart.getAttribute("after") < 0 && !chart.getRoot().getAttribute("paused")

export const shouldGlow = chart => isLiveLayout(chart) && isFollowingNow(chart)

const getLastIndex = values => {
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] != null) return i
  }
  return -1
}

const getStroke = (self, series, index) =>
  typeof series.stroke === "function" ? series.stroke(self, index) : series.stroke

const drawCircle = (ctx, x, y, radius) => {
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
}

export default chartUI => self => {
  const { chart } = chartUI

  if (!shouldGlow(chart)) return

  const xs = self.data[0]
  if (!xs?.length) return

  const dpr = getPxRatio()
  const { ctx, bbox } = self
  const right = bbox.left + bbox.width
  let drawn = 0

  ctx.save()

  for (let index = 1; index < self.series.length && drawn < maxGlowSeries; index++) {
    const series = self.series[index]
    const values = self.data[index]
    if (!series?.show || !values) continue

    const last = getLastIndex(values)
    if (last === -1) continue

    const x = self.valToPos(xs[last], "x", true)
    const y = self.valToPos(values[last], series.scale || "y", true)
    if (!isFinite(x) || !isFinite(y) || x < bbox.left || x > right) continue
    if (y < bbox.top || y > bbox.top + bbox.height) continue

    const color = getStroke(self, series, index)
    const alpha = typeof series.alpha === "number" ? series.alpha : 1

    ctx.fillStyle = color
    ctx.globalAlpha = haloAlpha * alpha
    drawCircle(ctx, x, y, haloRadius * dpr)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.shadowColor = color
    ctx.shadowBlur = glowBlur * dpr
    drawCircle(ctx, x, y, dotRadius * dpr)
    ctx.restore()

    drawn += 1
  }

  ctx.restore()
}
