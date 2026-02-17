import { makeGetColor } from "@/helpers/heatmap"

export default chartUI => plotter => {
  if (!chartUI) return

  // We need to handle all the series simultaneously.
  if (plotter.seriesIndex !== 0) return

  const dimensionIds = chartUI.chart.getVisibleDimensionIds()

  const g = plotter.dygraph
  const ctx = plotter.drawingContext
  const sets = plotter.allSeriesPoints
  const series = g.layout_.setNames

  let minWidthSep = Infinity
  sets.forEach(points => {
    const widthSep = points[1].canvasx - points[0].canvasx
    if (widthSep < minWidthSep) minWidthSep = widthSep
  })

  const barWidth = Math.floor(minWidthSep)

  const getColor = makeGetColor(chartUI.chart)

  series.forEach((seriesName, j) => {
    const index = chartUI.chart.getDimensionIndex(seriesName)

    if (index === -1) return

    const height = Math.abs(
      index === 0
        ? g.toDomYCoord(index + 1) - g.toDomYCoord(index)
        : g.toDomYCoord(index) - g.toDomYCoord(index - 1)
    )

    sets[j].forEach((p, i) => {
      const value = chartUI.chart.getDimensionValue(dimensionIds[index], i, { allowNull: true })

      ctx.fillStyle = getColor(value)
      ctx.fillRect(p.canvasx - barWidth / 2, g.toDomYCoord(index) - height / 2, barWidth, height)

      ctx.strokeStyle = "transparent"
      ctx.strokeRect(p.canvasx - barWidth / 2, g.toDomYCoord(index) - height / 2, barWidth, height)
    })
  })
}
