import { scaleLinear } from "d3-scale"
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

export const getWidth = (data, { aspectRatio, cellSize } = {}) => {
  const rows = getRows(data, aspectRatio)
  const columns = getColumns(rows, aspectRatio)
  return getFullWidth(columns, cellSize)
}

const getCanvasAttributes = (data, { aspectRatio, cellSize, padding } = {}) => {
  const rows = getRows(data, aspectRatio)
  const columns = getColumns(rows, aspectRatio)
  const width = getFullWidth(columns, cellSize)
  const height = getFullHeight(rows, cellSize, padding)

  return { width, height, columns: Math.ceil(columns) }
}

const defaultColorRange = ["rgba(198, 227, 246, 0.9)", "rgba(14, 154, 255, 0.9)"]

const makeGetColor = (values, colorRange = defaultColorRange) => {
  const minMax = values.reduce(
    (acc, value) => {
      if (value < acc[0]) acc[0] = value
      if (value > acc[1]) acc[1] = value
      return acc
    },
    [values[0], values[0]]
  )

  return scaleLinear().domain(minMax).range(colorRange)
}

export default (el, { onMouseenter, onMouseout }, options = {}) => {
  const { cellSize, cellPadding, cellStroke = 2, lineWidth = 1, colorRange } = options
  const canvas = el.getContext("2d")

  let activeBox = -1
  let deactivateBox = () => {}
  let activateBox = {}
  let clearEvents = () => {}

  const clear = () => {
    deactivateBox()
    clearEvents()
    canvas.clearRect(0, 0, el.width, el.height)
    canvas.beginPath()
  }

  const update = ({ data }) => {
    const { width, height, columns } = getCanvasAttributes(data, options)
    el.width = parseInt(width)
    el.height = parseInt(height)
    clear()
    clearEvents()
    const getColor = makeGetColor(data, colorRange)

    const drawBox = (value, index) => {
      canvas.fillStyle = getColor(value)

      const offsetX = getXPosition(columns, index, cellSize)
      const offsetY = getYPosition(columns, index, cellSize)

      if (lineWidth && cellStroke) {
        canvas.clearRect(
          offsetX - lineWidth,
          offsetY - lineWidth,
          getCellBoxSize(cellSize, cellPadding) + cellStroke,
          getCellBoxSize(cellSize, cellPadding) + cellStroke
        )
      }

      canvas.fillRect(
        offsetX,
        offsetY,
        getCellBoxSize(cellSize, cellPadding),
        getCellBoxSize(cellSize, cellPadding)
      )
    }

    data.forEach(drawBox)

    clearEvents = registerEvents(
      el,
      columns,
      data.length,
      {
        onMouseenter,
        onMouseout,
      },
      options
    )

    deactivateBox = () => {
      if (activeBox !== -1) drawBox(data[activeBox], activeBox)
    }

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
