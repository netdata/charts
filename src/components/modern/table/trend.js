import React, { useMemo } from "react"
import { useChart, usePayload } from "@/components/provider"
import { getWindowDelta } from "@/helpers/valueFocus"

const maxPoints = 40

export const getSeries = (chart, id) => {
  const { all = [] } = chart.getPayload() || {}
  if (!id) return []

  return all.map(row => {
    const value = chart.getRowDimensionValue(id, row, {
      abs: false,
      incrementable: false,
      allowNull: true,
    })
    return typeof value === "number" && Number.isFinite(value) ? value : null
  })
}

export const getTrend = (chart, id, points = maxPoints) => {
  const values = getSeries(chart, id)
  if (values.length < 2) return []

  const size = Math.max(1, Math.ceil(values.length / points))
  const trend = []

  for (let start = 0; start < values.length; start += size) {
    let sum = 0
    let count = 0
    for (let index = start; index < Math.min(values.length, start + size); index++) {
      if (values[index] === null) continue
      sum += values[index]
      count++
    }
    trend.push(count ? sum / count : null)
  }

  return trend.filter(value => value !== null).length < 2 ? [] : trend
}

export const getTrendPoints = (trend, width, height, inset = 1.5) => {
  const numbers = trend.filter(value => value !== null)
  if (numbers.length < 2) return []

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  const span = max - min || 1
  const step = width / (trend.length - 1)

  return trend.map((value, index) =>
    value === null
      ? null
      : [
          index * step,
          max === min ? height / 2 : inset + (1 - (value - min) / span) * (height - inset * 2),
        ]
  )
}

export const makeTrendPath = (trend, width, height, inset = 1.5) => {
  let pen = "M"

  return getTrendPoints(trend, width, height, inset).reduce((path, point) => {
    if (!point) {
      pen = "M"
      return path
    }
    const next = `${path}${pen}${point[0].toFixed(1)},${point[1].toFixed(1)}`
    pen = "L"
    return next
  }, "")
}

export const useTrend = id => {
  const chart = useChart()
  const payload = usePayload()

  return useMemo(() => {
    const series = getSeries(chart, id)
    return { series, trend: getTrend(chart, id), moved: !!getWindowDelta(series) }
  }, [chart, payload, id])
}

export const trendWidth = 40
export const trendHeight = 16

const Trend = ({ trend, color, width = trendWidth, height = trendHeight }) => {
  const points = useMemo(() => getTrendPoints(trend, width, height), [trend, width, height])
  const path = useMemo(() => makeTrendPath(trend, width, height), [trend, width, height])
  const end = points.filter(Boolean).pop()

  if (!path) return null

  return (
    <svg
      data-testid="modernTable-trend"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      style={{ flex: "none", overflow: "visible" }}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle data-testid="modernTable-trendEnd" cx={end[0]} cy={end[1]} r={2.4} fill={color} />
    </svg>
  )
}

export default Trend
