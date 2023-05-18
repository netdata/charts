import { scaleLinear } from "d3-scale"

const colors = [
  "transparent",
  "rgb(94, 79, 162)",
  "rgb(68, 121, 179)",
  "rgb(119, 198, 167)",
  "rgb(211, 237, 158)",
  "rgb(252, 246, 173)",
  "rgb(253, 190, 112)",
  "rgb(237, 104, 73)",
  "rgb(178, 23, 71)",
]

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

  const { min, max } = chartUI.chart.getAttributes()
  const step = (max - min) / (colors.length - 1)

  const getColor = scaleLinear()
    .domain(Array.from({ length: colors.length - 1 }, (_, i) => min + i * step))
    .range(colors)

  series.forEach((seriesName, j) => {
    const index = dimensionIds.findIndex(id => id === seriesName)

    if (index === -1) return

    const height = Math.abs(
      index === 0
        ? g.toDomYCoord(index + 1) - g.toDomYCoord(index)
        : g.toDomYCoord(index) - g.toDomYCoord(index - 1)
    )

    sets[j].forEach((p, i) => {
      const prevSeriesValue = chartUI.chart.getDimensionValue(dimensionIds[index - 1], i) || 0
      const value = chartUI.chart.getDimensionValue(dimensionIds[index], i) || 0

      ctx.fillStyle = getColor(
        chartUI.chart.getHeatmapType() === "incremental" ? value - prevSeriesValue : value
      )
      ctx.fillRect(p.canvasx - barWidth / 2, g.toDomYCoord(index) - height / 2, barWidth, height)

      ctx.strokeStyle = "transparent"
      ctx.strokeRect(p.canvasx - barWidth / 2, g.toDomYCoord(index) - height / 2, barWidth, height)
    })
  })
}
