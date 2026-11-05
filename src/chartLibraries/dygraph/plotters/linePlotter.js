import Dygraph from "dygraphs/src/dygraph"
import "dygraphs/src/extras/smooth-plotter"

const isValidPoint = point => point && point.canvasy && !isNaN(point.canvasy)

const smoothLinePlotter = ({ drawingContext, points }) => {
  drawingContext.beginPath()
  drawingContext.moveTo(points[0].canvasx, points[0].canvasy)

  let lastRightX = points[0].canvasx
  let lastRightY = points[0].canvasy
  const configuredSmoothing = Dygraph.smoothPlotter.smoothing
  const alpha = configuredSmoothing === undefined ? 1 / 3 : configuredSmoothing

  for (let index = 1; index < points.length; index++) {
    const previous = isValidPoint(points[index - 1]) ? points[index - 1] : null
    const point = isValidPoint(points[index]) ? points[index] : null
    const next = isValidPoint(points[index + 1]) ? points[index + 1] : null

    if (previous && point) {
      let leftX
      let leftY
      let rightX
      let rightY

      if (!next) {
        leftX = point.canvasx
        leftY = point.canvasy
        rightX = null
        rightY = null
      } else {
        leftX = (1 - alpha) * point.canvasx + alpha * previous.canvasx
        leftY = (1 - alpha) * point.canvasy + alpha * previous.canvasy
        rightX = (1 - alpha) * point.canvasx + alpha * next.canvasx
        rightY = (1 - alpha) * point.canvasy + alpha * next.canvasy

        if (leftX != rightX) {
          const deltaY =
            point.canvasy -
            rightY -
            ((point.canvasx - rightX) * (leftY - rightY)) / (leftX - rightX)
          leftY += deltaY
          rightY += deltaY
        }

        if (leftY > previous.canvasy && leftY > point.canvasy) {
          leftY = Math.max(previous.canvasy, point.canvasy)
          rightY = 2 * point.canvasy - leftY
        } else if (leftY < previous.canvasy && leftY < point.canvasy) {
          leftY = Math.min(previous.canvasy, point.canvasy)
          rightY = 2 * point.canvasy - leftY
        }

        if (rightY > point.canvasy && rightY > next.canvasy) {
          rightY = Math.max(point.canvasy, next.canvasy)
          leftY = 2 * point.canvasy - rightY
        } else if (rightY < point.canvasy && rightY < next.canvasy) {
          rightY = Math.min(point.canvasy, next.canvasy)
          leftY = 2 * point.canvasy - rightY
        }
      }

      lastRightX = lastRightX !== null ? lastRightX : previous.canvasx
      lastRightY = lastRightY !== null ? lastRightY : previous.canvasy
      drawingContext.bezierCurveTo(
        lastRightX,
        lastRightY,
        leftX,
        leftY,
        point.canvasx,
        point.canvasy
      )
      lastRightX = rightX
      lastRightY = rightY
    } else if (point) {
      drawingContext.moveTo(point.canvasx, point.canvasy)
      lastRightX = point.canvasx
      lastRightY = point.canvasy
    } else {
      lastRightX = null
      lastRightY = null
    }
  }

  drawingContext.stroke()
}

export default () => smoothLinePlotter
