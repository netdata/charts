export default () => plotter => {
  const ctx = plotter.drawingContext
  const points = plotter.points
  const y_bottom = plotter.dygraph.toDomYCoord(0)

  ctx.fillStyle = plotter.color

  const min_sep = points[1].canvasx - points[0].canvasx

  const bar_width = Math.floor((2.0 / 3) * min_sep)

  // Do the actual plotting.
  points.forEach(p => {
    const center_x = p.canvasx

    ctx.fillRect(center_x - bar_width / 2, p.canvasy, bar_width, y_bottom - p.canvasy)

    ctx.strokeRect(center_x - bar_width / 2, p.canvasy, bar_width, y_bottom - p.canvasy)
  })
}
