import React, { memo, useCallback, useLayoutEffect, useRef } from "react"

const defaultWidth = 120
const defaultHeight = 25
const linePadding = 2

export const getSparklinePoints = (values, width, height) => {
  const finiteValues = values.filter(Number.isFinite)
  if (!finiteValues.length) return []

  const min = Math.min(...finiteValues)
  const max = Math.max(...finiteValues)
  const range = max - min
  const xRange = Math.max(width - linePadding * 2, 1)
  const yRange = Math.max(height - linePadding * 2, 1)
  const divisor = Math.max(values.length - 1, 1)

  return values.map((value, index) => {
    if (!Number.isFinite(value)) return null

    return {
      x: linePadding + (index / divisor) * xRange,
      y: range ? linePadding + ((max - value) / range) * yRange : height / 2,
    }
  })
}

export const drawSparkline = (context, values, width, height, color) => {
  const points = getSparklinePoints(values, width, height)
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
  context.lineWidth = 1.25
  context.lineJoin = "round"
  context.lineCap = "round"
  context.stroke()
}

const SparklineCanvas = ({ values, color, height = defaultHeight }) => {
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
    drawSparkline(context, values, width, height, color)
  }, [color, height, values])

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
    <canvas
      ref={canvasRef}
      width={defaultWidth}
      height={height}
      role="img"
      aria-label="Metric trend"
      style={{ display: "block", width: "100%", height: `${height}px` }}
    />
  )
}

export default memo(SparklineCanvas)
