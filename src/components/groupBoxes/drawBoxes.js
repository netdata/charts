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
} from "./utilities"
import registerEvents from "./events"

export const getWidth = (dimensions, { aspectRatio, cellSize } = {}) => {
  const rows = getRows(dimensions, aspectRatio)
  const columns = getColumns(rows, aspectRatio)
  return getFullWidth(columns, cellSize)
}

const getCanvasAttributes = (dimensions, { aspectRatio, cellSize, padding } = {}) => {
  const rows = getRows(dimensions, aspectRatio)
  const columns = getColumns(rows, aspectRatio)
  const width = getFullWidth(columns, cellSize)
  const height = getFullHeight(rows, cellSize, padding)

  return { width, height, columns: Math.ceil(columns) }
}

const defaultColorRange = ["rgba(198, 227, 246, 0.9)", "rgba(43, 44, 170, 1)"]

export const makeGetColor = (min, max, colorRange = defaultColorRange) =>
  scaleLinear().domain([min, max]).range(colorRange)

export default (chart, el, { onMouseenter, onMouseout }, options = {}) => {
  const { cellSize, cellPadding, cellStroke = 2, lineWidth = 1, colorRange } = options
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

  function* update(dimensions, getColor, pointData) {
    const { width, height, columns } = getCanvasAttributes(dimensions, options)

    backgroundEl.width = parseInt(width)
    backgroundEl.height = parseInt(height)

    backgroundCanvas.clearRect(0, 0, backgroundEl.width, backgroundEl.height)

    getColor = getColor || makeGetColor(dimensions, colorRange)

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

      if (lineWidth && cellStroke) {
        canvas.lineWidth = lineWidth
        canvas.strokeStyle = "#fff"
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
  }
}
