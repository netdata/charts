import { scaleLinear } from "d3-scale"

export default chartUI => plotter => {
  if (!chartUI) return

  // We need to handle all the series simultaneously.

  if (plotter.setName === "ANOMALY_RATE") {
    const ctx = plotter.drawingContext
    const points = plotter.points

    let min_sep = points[1].canvasx - points[0].canvasx + 1

    const bar_width = Math.floor(min_sep)

    const getColor = scaleLinear()
      .domain([0, 100])
      .range([chartUI.getThemeAttribute("themeScaleColor"), "#9F75F9"])

    const dimensionIds = chartUI.chart.getPayloadDimensionIds()
    const selectedLegendDimensions = chartUI.chart.getAttribute("selectedLegendDimensions")

    const selectedIdsSet = dimensionIds.reduce((set, id, index) => {
      if (!selectedLegendDimensions.length) {
        set.add(index)
      } else {
        if (chartUI.chart.isDimensionVisible(id)) set.add(index)
      }
      return set
    }, new Set())

    points.forEach(p => {
      const center_x = p.canvasx

      const value = p.yval.reduce(
        (max, val, index) => (selectedIdsSet.has(index) ? (max > val ? max : val) : max),
        0
      )

      ctx.fillStyle = getColor(value)
      ctx.fillRect(center_x - bar_width / 2, 0, bar_width, 15)

      ctx.strokeStyle = getColor(value)
      ctx.strokeRect(center_x - bar_width / 2, 0, bar_width, 15)
    })
  }
}
