import { enums, parts, check, colors, priorities } from "@/helpers/annotations"
import { getRowPointValue } from "@/sdk/makeChart/getPointValue"

const annotationLineAlpha = 0.45
const stripHeight = 4

export default chartUI => self => {
  if (!chartUI) return
  if (!chartUI.chart.getAttribute("showAnnotations")) return

  const xs = self.data[0]
  if (!xs || !xs[1]) return

  const dpr = self.pxRatio || 1
  const ctx = self.ctx

  const minSep = self.valToPos(xs[1], "x", true) - self.valToPos(xs[0], "x", true) + 1
  const barWidth = Math.floor(minSep)

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

  const height = stripHeight * dpr
  const top = self.bbox.top + self.bbox.height - height

  ctx.save()

  xs.forEach(x => {
    const centerX = self.valToPos(x, "x", true)

    const row = chartUI.chart.getClosestRow(x * 1000)
    const pointData = all[row]
    const valueSet = new Set()

    selectedIdsSet.forEach(index => {
      const annotation = getRowPointValue(pointData, index + 1, point, "pa")
      if (annotation) parts.forEach(a => check(annotation, enums[a]) && valueSet.add(a))
    })

    const values = [...valueSet].sort((a, b) => priorities[a] < priorities[b])

    ctx.strokeStyle = ctx.fillStyle = "transparent"

    ctx.fillRect(centerX - barWidth / 2, top, barWidth, height)
    ctx.strokeRect(centerX - barWidth / 2, top, barWidth, height)

    const previousAlpha = ctx.globalAlpha ?? 1
    ctx.globalAlpha = annotationLineAlpha

    values.forEach(val => {
      ctx.strokeStyle = ctx.fillStyle = colors[val] || "transparent"

      ctx.fillRect(centerX - barWidth / 2, top, barWidth, height)
      ctx.strokeRect(centerX - barWidth / 2, top, barWidth, height)
    })

    ctx.globalAlpha = previousAlpha
  })

  ctx.restore()
}
