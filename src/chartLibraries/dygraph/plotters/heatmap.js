import { scaleLinear } from "d3-scale"

export default chartUI => plotter => {
  if (!chartUI) return

  // We need to handle all the series simultaneously.
  if (plotter.seriesIndex !== 0) return

  const g = plotter.dygraph
  const ctx = plotter.drawingContext
  const sets = plotter.allSeriesPoints

  let min_sep = Infinity
  sets.forEach(points => {
    const sep = points[1].canvasx - points[0].canvasx
    if (sep < min_sep) min_sep = sep
  })

  const bar_width = Math.floor(min_sep)

  const { min, max } = chartUI.chart.getPayload()
  const getColor = scaleLinear()
    .domain([min, (min * max) / 0.5, max])
    .range([chartUI.getThemeAttribute("themeScaleColor"), "#00BAE2", "#FF4136"])

  sets.forEach((points, j) => {
    points.forEach(p => {
      const center_x = p.canvasx

      ctx.fillStyle = getColor(p.yval)
      ctx.fillRect(center_x - bar_width / 2, g.toDomYCoord(j), bar_width, -g.toDomYCoord(j))

      ctx.strokeStyle = getColor(p.yval)
      ctx.strokeRect(center_x - bar_width / 2, g.toDomYCoord(j), bar_width, -g.toDomYCoord(j))
    })
  })
}
