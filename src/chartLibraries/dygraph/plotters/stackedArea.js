import Dygraph from "dygraphs"
import { getDivergingStackBounds } from "../divergingStack"

const makeFillPlotter = () => plotter => {
  const { drawingContext: ctx, dygraph, points, setName } = plotter
  const stepPlot = dygraph.getBooleanOption("stepPlot", setName)

  ctx.fillStyle = plotter.color
  ctx.globalAlpha = dygraph.getNumericOption("fillAlpha", setName)
  ctx.beginPath()

  let previous

  points.forEach(point => {
    const bounds = getDivergingStackBounds(point)
    if (!bounds) {
      previous = null
      return
    }

    const current = {
      x: point.canvasx,
      baseY: dygraph.toDomYCoord(bounds.base),
      endY: dygraph.toDomYCoord(bounds.end),
    }

    if (previous) {
      ctx.moveTo(previous.x, previous.endY)

      if (stepPlot) {
        ctx.lineTo(current.x, previous.endY)
        ctx.lineTo(current.x, current.endY)
      } else {
        ctx.lineTo(current.x, current.endY)
      }

      ctx.lineTo(current.x, current.baseY)
      ctx.lineTo(previous.x, previous.baseY)
      ctx.closePath()
    }

    previous = current
  })

  ctx.fill()
}

const makeLinePlotter = () => plotter => {
  plotter.points.forEach(point => {
    const bounds = getDivergingStackBounds(point)
    if (bounds) point.canvasy = plotter.dygraph.toDomYCoord(bounds.end)
  })

  Dygraph.Plotters.linePlotter(plotter)
}

export default () => [makeFillPlotter(), makeLinePlotter()]
