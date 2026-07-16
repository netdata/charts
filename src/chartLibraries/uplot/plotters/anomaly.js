import { scaleLinear } from "d3-scale"
import { getRowPointValue } from "@/sdk/makeChart/getPointValue"

const ribbonHeight = 15

export default chartUI => self => {
  if (!chartUI) return
  if (!chartUI.chart.getAttribute("showAnomalies")) return

  const xs = self.data[0]
  if (!xs || !xs[1]) return

  const dpr = self.pxRatio || 1
  const ctx = self.ctx

  const minSep = self.valToPos(xs[1], "x", true) - self.valToPos(xs[0], "x", true) + 1
  const barWidth = Math.floor(minSep)

  const getColor = scaleLinear()
    .domain([0, 100])
    .range(["transparent", chartUI.chart.getThemeAttribute("themeAnomalyScaleColor")])

  const dimensionIds = chartUI.chart.getPayloadDimensionIds()
  const selectedLegendDimensions = chartUI.chart.getAttribute("selectedLegendDimensions")

  const selectedIdsSet = dimensionIds.reduce((h, id, index) => {
    if (!selectedLegendDimensions.length) {
      h.add(index)
    } else {
      if (chartUI.chart.isDimensionVisible(id)) h.add(index)
    }
    return h
  }, new Set())

  const { all, point } = chartUI.chart.getPayload()
  if (!all) return

  const top = self.bbox.top
  const height = ribbonHeight * dpr

  ctx.save()

  xs.forEach(x => {
    const centerX = self.valToPos(x, "x", true)

    const row = chartUI.chart.getClosestRow(x * 1000)
    const pointData = all[row]
    let value = 0

    selectedIdsSet.forEach(index => {
      const anomalyRate = getRowPointValue(pointData, index + 1, point, "arp") || 0
      if (anomalyRate > value) value = anomalyRate
    })

    ctx.strokeStyle = ctx.fillStyle = getColor(value)
    ctx.fillRect(centerX - barWidth / 2, top, barWidth, height)
    ctx.strokeRect(centerX - barWidth / 2, top, barWidth, height)
  })

  ctx.restore()
}
