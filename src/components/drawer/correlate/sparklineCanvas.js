import React, { memo, useCallback, useLayoutEffect, useRef } from "react"
import { Box } from "@netdata/netdata-ui"

const defaultWidth = 120
const defaultHeight = 24
const linePadding = 4

export const getSparklinePoints = (values, width, height, range = {}) => {
  const finiteValues = values.filter(Number.isFinite)
  if (!finiteValues.length) return []

  const min = Number.isFinite(range.min) ? range.min : Math.min(...finiteValues)
  const max = Number.isFinite(range.max) ? range.max : Math.max(...finiteValues)
  const span = max - min
  const xRange = Math.max(width - linePadding * 2, 1)
  const yRange = Math.max(height - linePadding * 2, 1)
  const divisor = Math.max(values.length - 1, 1)

  return values.map((value, index) => {
    if (!Number.isFinite(value)) return null

    return {
      x: linePadding + (index / divisor) * xRange,
      y: span ? linePadding + ((max - value) / span) * yRange : height / 2,
    }
  })
}

export const drawSparkline = (context, values, width, height, color, range) => {
  const points = getSparklinePoints(values, width, height, range)
  context.clearRect(0, 0, width, height)
  if (!points.length) return

  context.beginPath()
  let drawing = false

  points.forEach(point => {
    if (!point) {
      drawing = false
      return
    }

    if (drawing) context.lineTo(point.x, point.y)
    else context.moveTo(point.x, point.y)
    drawing = true
  })

  context.strokeStyle = color
  context.lineWidth = 1
  context.lineJoin = "round"
  context.lineCap = "round"
  context.stroke()
}

const SparklineCanvas = ({ values, color, height = defaultHeight, range }) => {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = Math.max(Math.round(canvas.getBoundingClientRect().width) || defaultWidth, 1)
    const ratio = window.devicePixelRatio || 1
    const pixelWidth = Math.round(width * ratio)
    const pixelHeight = Math.round(height * ratio)

    if (canvas.width !== pixelWidth) canvas.width = pixelWidth
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight

    const context = canvas.getContext("2d")
    if (!context) return

    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    drawSparkline(context, values, width, height, color, range)
  }, [color, height, range, values])

  useLayoutEffect(() => {
    draw()

    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(() => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = window.requestAnimationFrame(draw)
    })
    observer.observe(canvasRef.current)

    return () => {
      observer.disconnect()
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current)
    }
  }, [draw])

  return (
    <Box
      as="canvas"
      ref={canvasRef}
      width="100%"
      height={`${height}px`}
      role="img"
      aria-label="Metric trend"
    />
  )
}

export default memo(SparklineCanvas)
