import { scaleLinear } from "d3-scale"
import { unstable_shouldYield as shouldYield } from "scheduler"
import { copyCanvas, createCanvas } from "@/helpers/canvas"
import {
  getCellBoxSize,
  getRows,
  getColumns,
  getXPosition,
  getYPosition,
  getFullWidth,
  getFullHeight,
  defaultCellSize,
} from "./utilities"
import registerEvents from "./events"

export const getWidth = (dimensions, { aspectRatio, cellSize } = {}) => {
  const rows = getRows(dimensions, aspectRatio)
  const columns = getColumns(rows, aspectRatio)
  return getFullWidth(columns, cellSize)
}

// When the caller gives the room it has, boxes fill that width row by row instead of keeping
// the aspect ratio, so a wide card is not left mostly empty.
const getFittedAttributes = (dimensions, availableWidth, { cellSize, padding } = {}) => {
  const size = cellSize || defaultCellSize
  const columns = Math.max(1, Math.min(dimensions.length, Math.floor(availableWidth / size)))
  const rows = Math.max(1, Math.ceil(dimensions.length / columns))

  return {
    width: getFullWidth(columns, cellSize),
    height: getFullHeight(rows, cellSize, padding),
    columns,
  }
}

const getCanvasAttributes = (dimensions, options = {}) => {
  const { aspectRatio, cellSize, padding, getAvailableWidth } = options
  const availableWidth = getAvailableWidth ? getAvailableWidth() : 0
  if (availableWidth > 0) return getFittedAttributes(dimensions, availableWidth, options)

  const rows = getRows(dimensions, aspectRatio)
  const columns = getColumns(rows, aspectRatio)
  const width = getFullWidth(columns, cellSize)
  const height = getFullHeight(rows, cellSize, padding)

  return { width, height, columns: Math.ceil(columns) }
}

export const makeGetColor = (min, max, colorRange) =>
  scaleLinear().domain([min, max]).range(colorRange)

const roundedRect = (ctx, x, y, size, radius) => {
  const r = Math.min(radius, size / 2)
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + size - r, y)
  ctx.quadraticCurveTo(x + size, y, x + size, y + r)
  ctx.lineTo(x + size, y + size - r)
  ctx.quadraticCurveTo(x + size, y + size, x + size - r, y + size)
  ctx.lineTo(x + r, y + size)
  ctx.quadraticCurveTo(x, y + size, x, y + size - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export default (chart, el, { onMouseenter, onMouseout }, options = {}) => {
  const {
    cellSize,
    cellPadding,
    cellStroke = 2,
    lineWidth = 1,
    colorRange = [
      chart.getThemeAttribute("themeGroupBoxesMin"),
      chart.getThemeAttribute("themeGroupBoxesMax"),
    ],
    radius = 0,
    makeColor,
    getActiveStroke = () => "#fff",
  } = options
  const canvas = el.getContext("2d")

  const backgroundEl = createCanvas(canvas.width, canvas.height)
  const backgroundCanvas = backgroundEl.getContext("2d")

  let activeBox = -1
  let deactivateBox = () => {}
  let activateBox = () => {}
  let clearEvents = () => {}

  const clear = () => {
    deactivateBox()
    clearEvents()
    canvas.clearRect(0, 0, el.width, el.height)
    backgroundCanvas.clearRect(0, 0, backgroundEl.width, backgroundEl.height)
  }

  function* update(dimensions, pointData) {
    const { width, height, columns } = getCanvasAttributes(dimensions, options)

    if (!width || !height) {
      if (shouldYield()) {
        yield
      }
      return
    }

    backgroundEl.width = parseInt(width)
    backgroundEl.height = parseInt(height)

    backgroundCanvas.clearRect(0, 0, backgroundEl.width, backgroundEl.height)

    const min = chart.getAttribute("min")
    const max = chart.getAttribute("max")

    const getColor = makeColor ? makeColor(min, max) : makeGetColor(min, max, colorRange)

    const drawBox = (ctx, id, index) => {
      ctx.beginPath()
      ctx.fillStyle = getColor(chart.getRowDimensionValue(id, pointData))

      const offsetX = getXPosition(columns, index, cellSize)
      const offsetY = getYPosition(columns, index, cellSize)

      if (lineWidth && cellStroke) {
        ctx.clearRect(
          offsetX - lineWidth,
          offsetY - lineWidth,
          getCellBoxSize(cellSize, cellPadding) + cellStroke,
          getCellBoxSize(cellSize, cellPadding) + cellStroke
        )
      }

      if (radius) {
        roundedRect(ctx, offsetX, offsetY, getCellBoxSize(cellSize, cellPadding), radius)
        ctx.fill()
        return
      }

      ctx.fillRect(
        offsetX,
        offsetY,
        getCellBoxSize(cellSize, cellPadding),
        getCellBoxSize(cellSize, cellPadding)
      )
    }

    for (let index = 0; index < dimensions.length; ++index) {
      drawBox(backgroundCanvas, dimensions[index], index)
      if (shouldYield()) {
        yield
      }
    }

    deactivateBox()
    clearEvents()
    copyCanvas(backgroundEl, el)

    clearEvents = registerEvents(
      el,
      columns,
      dimensions.length,
      {
        onMouseenter,
        onMouseout,
      },
      options
    )

    deactivateBox = () => activeBox !== -1 && drawBox(canvas, dimensions[activeBox], activeBox)

    activateBox = index => {
      deactivateBox()
      activeBox = index

      const offsetX = getXPosition(columns, index, cellSize)
      const offsetY = getYPosition(columns, index, cellSize)

      if (lineWidth && cellStroke && radius) {
        const inset = lineWidth / 2
        canvas.beginPath()
        canvas.lineWidth = lineWidth
        canvas.strokeStyle = getActiveStroke()
        roundedRect(
          canvas,
          offsetX + inset,
          offsetY + inset,
          getCellBoxSize(cellSize, cellPadding) - lineWidth,
          Math.max(0, radius - inset)
        )
        canvas.stroke()
        return
      }

      if (lineWidth && cellStroke) {
        canvas.lineWidth = lineWidth
        canvas.strokeStyle = getActiveStroke()
        canvas.strokeRect(
          offsetX + lineWidth,
          offsetY + lineWidth,
          getCellBoxSize(cellSize, cellPadding) - cellStroke,
          getCellBoxSize(cellSize, cellPadding) - cellStroke
        )
      }
    }
  }

  return {
    clear,
    update,
    activateBox: index => activateBox(index),
    deactivateBox: () => deactivateBox(),
    getElement: () => backgroundEl,
  }
}
