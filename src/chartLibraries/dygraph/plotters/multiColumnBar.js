import { darkenColor } from "./helpers"

export default () => plotter => {
  if (plotter.seriesIndex !== 0) return

  const g = plotter.dygraph
  const ctx = plotter.drawingContext
  const sets = plotter.allSeriesPoints
  const y_bottom = g.toDomYCoord(0)

  let min_sep = Infinity
  sets.forEach(points => {
    const sep = points[1].canvasx - points[0].canvasx
    if (sep < min_sep) min_sep = sep
  })

  const bar_width = Math.floor((2.0 / 3) * min_sep)

  const fillColors = g.getColors()
  const strokeColors = g.getColors().map(color => darkenColor(color))

  sets.forEach((points, j) => {
    ctx.fillStyle = fillColors[j]
    ctx.strokeStyle = strokeColors[j]

    points.forEach(p => {
      const center_x = p.canvasx
      const x_left = center_x - (bar_width / 2) * (1 - j / (sets.length > 1 ? sets.length - 1 : 1))

      ctx.fillRect(x_left, p.canvasy, bar_width / sets.length, y_bottom - p.canvasy)
      ctx.strokeRect(x_left, p.canvasy, bar_width / sets.length, y_bottom - p.canvasy)
    })
  })
}
