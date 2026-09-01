import { scaleLinear } from "d3-scale"
import { getRowPointValue } from "@/sdk/makeChart/getPointValue"
import { isVisibleDimension } from "@/chartLibraries/helpers/dimensionVisibility"

const ribbonHeight = 15

export default chartUI => self => {
  if (!chartUI) return

  const { chart } = chartUI
  if (!chart.getAttribute("showAnomalies")) return

  const xs = self.data[0]
  if (!xs || !xs[1]) return

  const dpr = self.pxRatio || 1
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

  const top = self.bbox.top
  const height = ribbonHeight * dpr

  ctx.save()

  // all is row-aligned with the payload data, and getData maps every row into xs, so the loop
  // index is the row - a per-point getClosestRow binary search was pure overhead
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

    ctx.strokeStyle = ctx.fillStyle = getColor(value)
    ctx.fillRect(centerX - barWidth / 2, top, barWidth, height)
    ctx.strokeRect(centerX - barWidth / 2, top, barWidth, height)
  }

  ctx.restore()
}
