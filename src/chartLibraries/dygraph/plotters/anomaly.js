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
      .range([chartUI.getThemeAttribute("themeScaleColor"), "#FF4136"])

    points.forEach(p => {
      const center_x = p.canvasx

      ctx.fillStyle = getColor(p.yval)
      ctx.fillRect(center_x - bar_width / 2, 0, bar_width, 15)

      ctx.strokeStyle = getColor(p.yval)
      ctx.strokeRect(center_x - bar_width / 2, 0, bar_width, 15)
    })
  }
}
