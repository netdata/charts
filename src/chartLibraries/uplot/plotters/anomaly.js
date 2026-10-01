import { scaleLinear } from "d3-scale"
import { getRowPointValue } from "@/sdk/makeChart/getPointValue"
import { isVisibleDimension } from "@/chartLibraries/helpers/dimensionVisibility"
import getPxRatio from "../pxRatio"
import { isModern, roundedRectPath } from "../overlays/modern"
import {
  anomalyNoiseFloor,
  getAnomalyColor,
  getAnomalyColumns,
  getRowAnomalyRate,
} from "@/components/modern/anomaly"

const ribbonHeight = 15

const markHeight = 4
const markGap = 1
const markRadius = 1
const markOffset = 6
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

  const columns = chart
    .getPayloadDimensionIds()
    .reduce((acc, id, index) => (isVisibleDimension(chart, id) ? acc.concat(index + 1) : acc), [])

  const { all, point } = chart.getPayload()
  if (!all) return

  const modern = isModern(chart)
  const top = modern ? getStripTop(self, dpr) : self.bbox.top
  const height = (modern ? markHeight : ribbonHeight) * dpr
  const markWidth = Math.max(2 * dpr, barWidth - markGap * dpr)
  const themeIndex = chart.getThemeIndex()

  ctx.save()

  for (let row = 0; row < xs.length; row++) {
    const pointData = all[row]
    if (!pointData) continue

    let value = 0

    for (let i = 0; i < columns.length; i++) {
      const anomalyRate = getRowPointValue(pointData, columns[i], point, "arp") || 0
      if (anomalyRate > value) value = anomalyRate
    }

    if (value === 0) continue

    const centerX = self.valToPos(xs[row], "x", true)

    if (modern) {
      if (value < anomalyNoiseFloor) continue
      roundedRectPath(ctx, centerX - markWidth / 2, top, markWidth, height, markRadius * dpr)
      ctx.fillStyle = getAnomalyColor(themeIndex, value)
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
  const themeIndex = chart.getThemeIndex()
  const step = self.valToPos(xs[1], "x", true) - self.valToPos(xs[0], "x", true)
  const { ctx, bbox } = self

  ctx.save()

  for (let row = 0; row < xs.length; row++) {
    const value = all[row] ? getRowAnomalyRate(all[row], columns, point) : 0
    if (value < anomalyNoiseFloor) continue

    const centerX = self.valToPos(xs[row], "x", true)
    const left = Math.round(centerX - step / 2)
    const right = Math.round(centerX + step / 2)
    ctx.fillStyle = getAnomalyColor(themeIndex, value, shadeAlpha(value))
    ctx.fillRect(left, bbox.top, right - left, bbox.height)
  }

  ctx.restore()
}
