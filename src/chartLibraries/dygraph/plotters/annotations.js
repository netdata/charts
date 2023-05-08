import { enums, parts, check, colors, priorities } from "@/helpers/annotations"

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

    const { all } = chartUI.chart.getPayload()

    points.forEach(p => {
      const center_x = p.canvasx

      const row = chartUI.chart.getClosestRow(p.xval)
      const [, ...annotations] = all[row]
      const valueSet = annotations.reduce((selected, { pa }, index) => {
        if (selectedIdsSet.has(index) && !!pa)
          parts.forEach(a => check(pa, enums[a]) && selected.add(a))

        return selected
      }, new Set())

      const values = [...valueSet].sort((a, b) => priorities[a] < priorities[b])

      const { h } = plotter.dygraph.getArea()

      ctx.fillStyle = chartUI.chart.getThemeAttribute("themeScaleColor")
      ctx.fillRect(center_x - bar_width / 2, h - 4, bar_width, h)
      ctx.strokeStyle = chartUI.chart.getThemeAttribute("themeScaleColor")
      ctx.strokeRect(center_x - bar_width / 2, h - 4, bar_width, h)

      const scale = 8 - 8 / values.length
      values.forEach((val, i) => {
        ctx.fillStyle = colors[val] || chartUI.chart.getThemeAttribute("themeScaleColor")
        ctx.fillRect(center_x - bar_width / 2, h - 4 - i * scale, bar_width, h + i * scale)

        ctx.strokeStyle = colors[val] || chartUI.chart.getThemeAttribute("themeScaleColor")
        ctx.strokeRect(center_x - bar_width / 2, h - 4 - i * scale, bar_width, h + i * scale)
      })
    })
  }
}
