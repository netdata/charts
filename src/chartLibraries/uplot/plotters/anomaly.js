import { scaleLinear } from "d3-scale"
import getPxRatio from "../pxRatio"
import { isModern, roundedRectPath } from "../overlays/modern"
import {
  isAnomalous,
  getAnomalyColor,
  getAnomalyColumns,
  getRowAnomalyRate,
} from "@/components/modern/anomaly"

const ribbonHeight = 15

const markHeight = 4
const markGap = 1
const markRadius = 1
const markOffset = 6
const spotlightBoost = 1.7
const shadeAlpha = rate => 0.08 + (Math.min(rate, 50) / 50) * 0.32

const getStripTop = (self, dpr) =>
  self.bbox.top >= markOffset * dpr ? self.bbox.top - markOffset * dpr : self.bbox.top + dpr

export default chartUI => self => {
  if (!chartUI) return

  const { chart } = chartUI
  if (!chart.getAttribute("showAnomalies")) return
  if (isModern(chart) && chart.isSparkline()) return

  const xs = self.data[0]
  if (!xs || !xs[1]) return

  const dpr = getPxRatio()
  const ctx = self.ctx

  const minSep = self.valToPos(xs[1], "x", true) - self.valToPos(xs[0], "x", true) + 1
  const barWidth = Math.floor(minSep)

  const getColor = scaleLinear()
    .domain([0, 100])
    .range(["transparent", chart.getThemeAttribute("themeAnomalyScaleColor")])

  const columns = getAnomalyColumns(chart)

  const { all, point } = chart.getPayload()
  if (!all) return

  const modern = isModern(chart)
  const top = modern ? getStripTop(self, dpr) : self.bbox.top
  const height = (modern ? markHeight : ribbonHeight) * dpr
  const markWidth = Math.max(2 * dpr, barWidth - markGap * dpr)

  ctx.save()

  for (let row = 0; row < xs.length; row++) {
    const pointData = all[row]
    if (!pointData) continue

    const value = getRowAnomalyRate(pointData, columns, point)
    if (!isAnomalous(value)) continue

    const centerX = self.valToPos(xs[row], "x", true)

    if (modern) {
      roundedRectPath(ctx, centerX - markWidth / 2, top, markWidth, height, markRadius * dpr)
      ctx.fillStyle = getAnomalyColor(chart, value)
      ctx.fill()
      continue
    }

    ctx.strokeStyle = ctx.fillStyle = getColor(value)
    ctx.fillRect(centerX - barWidth / 2, top, barWidth, height)
    ctx.strokeRect(centerX - barWidth / 2, top, barWidth, height)
  }

  ctx.restore()
}

export const makeAnomalyShade = chartUI => self => {
  if (!chartUI) return

  const { chart } = chartUI
  if (!chart.getAttribute("showAnomalies") || !isModern(chart) || chart.isSparkline()) return

  const xs = self.data[0]
  if (!xs || !xs[1]) return

  const { all, point } = chart.getPayload()
  if (!all) return

  const columns = getAnomalyColumns(chart)
  const step = self.valToPos(xs[1], "x", true) - self.valToPos(xs[0], "x", true)
  const boost = chart.getAttribute("anomalySpotlight") ? spotlightBoost : 1
  const { ctx, bbox } = self

  ctx.save()

  for (let row = 0; row < xs.length; row++) {
    const value = all[row] ? getRowAnomalyRate(all[row], columns, point) : 0
    if (!isAnomalous(value)) continue

    const centerX = self.valToPos(xs[row], "x", true)
    const left = Math.round(centerX - step / 2)
    const right = Math.round(centerX + step / 2)
    ctx.fillStyle = getAnomalyColor(chart, value, Math.min(1, shadeAlpha(value) * boost))
    ctx.fillRect(left, bbox.top, right - left, bbox.height)
  }

  ctx.restore()
}

export const makeAnomalySpotlight = chartUI => self => {
  if (!chartUI) return

  const { chart } = chartUI
  if (!chart.getAttribute("anomalySpotlight") || !isModern(chart) || chart.isSparkline()) return

  const xs = self.data[0]
  if (!xs || !xs[1]) return

  const { all, point } = chart.getPayload()
  if (!all) return

  const columns = getAnomalyColumns(chart)
  const step = self.valToPos(xs[1], "x", true) - self.valToPos(xs[0], "x", true)
  const { ctx, bbox } = self
  const edge = row => self.valToPos(xs[row], "x", true)

  ctx.save()
  ctx.fillStyle = chart.getThemeAttribute("themeAnomalySpotlightDim")

  let from = -1
  for (let row = 0; row <= xs.length; row++) {
    const calm =
      row < xs.length && !isAnomalous(all[row] ? getRowAnomalyRate(all[row], columns, point) : 0)
    if (calm && from < 0) from = row
    if (calm || from < 0) continue

    const left = Math.max(bbox.left, Math.round(edge(from) - step / 2))
    const right = Math.min(bbox.left + bbox.width, Math.round(edge(row - 1) + step / 2))
    ctx.fillRect(left, bbox.top, right - left, bbox.height)
    from = -1
  }

  ctx.restore()
}
