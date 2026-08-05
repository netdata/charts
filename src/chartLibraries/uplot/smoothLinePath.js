import uPlot from "uplot"

const alpha = 1 / 3

const isValidPoint = point => point && point.y && !isNaN(point.y)

const linearPathBuilder = uPlot.paths.linear && uPlot.paths.linear()

/**
 * Reproduces dygraph's smoothLinePlotter (chartLibraries/dygraph/plotters/linePlotter.js)
 * as an ordered list of canvas ops. Given raw float pixel points `{ x, y } | null`, it emits
 * `{ type: "moveTo", x, y }` and `{ type: "bezier", cp1x, cp1y, cp2x, cp2y, x, y }` ops with the
 * exact same control-point geometry, so uPlot line charts curve identically to dygraph.
 */
export const computeSmoothOps = points => {
  const ops = []
  if (!points.length) return ops

  ops.push({ type: "moveTo", x: points[0].x, y: points[0].y })

  let lastRightX = points[0].x
  let lastRightY = points[0].y

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
        leftX = point.x
        leftY = point.y
        rightX = null
        rightY = null
      } else {
        leftX = (1 - alpha) * point.x + alpha * previous.x
        leftY = (1 - alpha) * point.y + alpha * previous.y
        rightX = (1 - alpha) * point.x + alpha * next.x
        rightY = (1 - alpha) * point.y + alpha * next.y

        if (leftX != rightX) {
          const deltaY =
            point.y - rightY - ((point.x - rightX) * (leftY - rightY)) / (leftX - rightX)
          leftY += deltaY
          rightY += deltaY
        }

        if (leftY > previous.y && leftY > point.y) {
          leftY = Math.max(previous.y, point.y)
          rightY = 2 * point.y - leftY
        } else if (leftY < previous.y && leftY < point.y) {
          leftY = Math.min(previous.y, point.y)
          rightY = 2 * point.y - leftY
        }

        if (rightY > point.y && rightY > next.y) {
          rightY = Math.max(point.y, next.y)
          leftY = 2 * point.y - rightY
        } else if (rightY < point.y && rightY < next.y) {
          rightY = Math.min(point.y, next.y)
          leftY = 2 * point.y - rightY
        }
      }

      lastRightX = lastRightX !== null ? lastRightX : previous.x
      lastRightY = lastRightY !== null ? lastRightY : previous.y
      ops.push({
        type: "bezier",
        cp1x: lastRightX,
        cp1y: lastRightY,
        cp2x: leftX,
        cp2y: leftY,
        x: point.x,
        y: point.y,
      })
      lastRightX = rightX
      lastRightY = rightY
    } else if (point) {
      ops.push({ type: "moveTo", x: point.x, y: point.y })
      lastRightX = point.x
      lastRightY = point.y
    } else {
      lastRightX = null
      lastRightY = null
    }
  }

  return ops
}

/**
 * Builds a uPlot path builder that strokes bezier curves matching dygraph's smoothLinePlotter.
 * It delegates gap/clip/fill handling to uPlot's built-in linear builder, then replaces only the
 * stroke path with the dygraph-exact smooth curve built from raw (unrounded) pixel coordinates.
 */
export const makeSmoothLinePathBuilder = () => (u, seriesIdx, idx0, idx1) => {
  const paths = linearPathBuilder(u, seriesIdx, idx0, idx1)

  const xs = u.data[0]
  const ys = u.data[seriesIdx]

  let start = idx0
  while (start <= idx1 && ys[start] == null) start++

  let end = idx1
  while (end >= start && ys[end] == null) end--

  const stroke = new Path2D()

  if (start <= end) {
    const points = []
    for (let i = start; i <= end; i++) {
      const value = ys[i]
      points.push(
        value == null ? null : { x: u.valToPos(xs[i], "x", true), y: u.valToPos(value, "y", true) }
      )
    }

    const ops = computeSmoothOps(points)
    for (let i = 0; i < ops.length; i++) {
      const op = ops[i]
      if (op.type === "moveTo") stroke.moveTo(op.x, op.y)
      else stroke.bezierCurveTo(op.cp1x, op.cp1y, op.cp2x, op.cp2y, op.x, op.y)
    }
  }

  paths.stroke = stroke
  return paths
}
