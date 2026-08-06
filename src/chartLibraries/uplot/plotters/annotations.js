import { enums, parts, check, colors, priorities } from "@/helpers/annotations"
import { getRowPointValue } from "@/sdk/makeChart/getPointValue"
import { isVisibleDimension } from "@/chartLibraries/helpers/dimensionVisibility"

const annotationLineAlpha = 0.45
const stripHeight = 4

export default chartUI => self => {
  if (!chartUI) return

  const { chart } = chartUI
  if (!chart.getAttribute("showAnnotations")) return

  const xs = self.data[0]
  if (!xs || !xs[1]) return

  const dpr = self.pxRatio || 1
  const ctx = self.ctx

  const minSep = self.valToPos(xs[1], "x", true) - self.valToPos(xs[0], "x", true) + 1
  const barWidth = Math.floor(minSep)

  const columns = chart
    .getPayloadDimensionIds()
    .reduce((acc, id, index) => (isVisibleDimension(chart, id) ? acc.concat(index + 1) : acc), [])

  const { all, point } = chart.getPayload()
  if (!all) return

  const height = stripHeight * dpr
  const top = self.bbox.top + self.bbox.height - height

  ctx.save()

  // the loop index is the row: all is row-aligned with the payload data
  for (let row = 0; row < xs.length; row++) {
    const pointData = all[row]
    if (!pointData) continue

    let valueSet = null

    for (let i = 0; i < columns.length; i++) {
      const annotation = getRowPointValue(pointData, columns[i], point, "pa")
      if (!annotation) continue

      parts.forEach(a => {
        if (!check(annotation, enums[a])) return
        if (!valueSet) valueSet = new Set()
        valueSet.add(a)
      })
    }

    if (!valueSet) continue

    const centerX = self.valToPos(xs[row], "x", true)
    const values = [...valueSet].sort((a, b) => priorities[a] < priorities[b])
    const previousAlpha = ctx.globalAlpha ?? 1

    ctx.globalAlpha = annotationLineAlpha

    values.forEach(val => {
      ctx.strokeStyle = ctx.fillStyle = colors[val] || "transparent"

      ctx.fillRect(centerX - barWidth / 2, top, barWidth, height)
      ctx.strokeRect(centerX - barWidth / 2, top, barWidth, height)
    })

    ctx.globalAlpha = previousAlpha
  }

  ctx.restore()
}
