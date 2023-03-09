import { scaleLinear } from "d3-scale"

const E = 1 // the database value is empty
const O = 2 // the database value is marked as reset (overflown/reset)
const P = 4 // the database provides partial data about this point (used in group-by)

const enums = {
  E,
  O,
  P,
}
const parts = Object.keys(enums)

const check = (bit, annotation) => bit & annotation

const colors = {
  P: "RGB(71, 183, 220)",
  O: "RGB(243, 231, 2)",
  E: "RGB(232, 199, 200)",
}

const priorities = {
  E: 0,
  P: 1,
  O: 2,
}

export default chartUI => plotter => {
  if (!chartUI) return

  // We need to handle all the series simultaneously.

  if (plotter.setName === "ANNOTATIONS") {
    const ctx = plotter.drawingContext
    const points = plotter.points

    let min_sep = points[1].canvasx - points[0].canvasx + 1

    const bar_width = Math.floor(min_sep)

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

    const { result } = chartUI.chart.getPayload()

    points.forEach(p => {
      const center_x = p.canvasx

      const row = chartUI.chart.getClosestRow(p.xval)
      const [, ...annotations] = result.all[row]
      const valueSet = annotations.reduce((selected, { pa = 0 }, index) => {
        if (selectedIdsSet.has(index) && !!pa)
          parts.forEach(a => check(pa, enums[a]) && selected.add(a))

        return selected
      }, new Set())

      const values = [...valueSet].sort((a, b) => priorities[a] < priorities[b])

      const { h } = plotter.dygraph.getArea()

      const scale = 10 - 10 / values.length
      values.forEach((val, i) => {
        ctx.fillStyle = colors[val] || chartUI.getThemeAttribute("themeScaleColor")
        ctx.fillRect(center_x - bar_width / 2, h - 10 - i * scale, bar_width, h + i * scale)

        ctx.strokeStyle = colors[val] || chartUI.getThemeAttribute("themeScaleColor")
        ctx.strokeRect(center_x - bar_width / 2, h - 10 - i * scale, bar_width, h + i * scale)
      })
    })
  }
}
