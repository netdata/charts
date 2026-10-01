import React, { useMemo } from "react"
import { useChart, usePayload } from "@/components/provider"

const maxPoints = 40

export const getTrend = (chart, id, points = maxPoints) => {
  const { all = [] } = chart.getPayload() || {}
  if (!id || all.length < 2) return []

  const values = []
  for (let index = 0; index < all.length; index++) {
    const value = chart.getRowDimensionValue(id, all[index], {
      abs: false,
      incrementable: false,
      allowNull: true,
    })
    values.push(typeof value === "number" && Number.isFinite(value) ? value : null)
  }

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

export const makeTrendPath = (trend, width, height, inset = 1.5) => {
  const numbers = trend.filter(value => value !== null)
  if (numbers.length < 2) return ""

  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  const span = max - min || 1
  const step = width / (trend.length - 1)

  let path = ""
  let pen = "M"

  trend.forEach((value, index) => {
    if (value === null) {
      pen = "M"
      return
    }
    const x = index * step
    const y = max === min ? height / 2 : inset + (1 - (value - min) / span) * (height - inset * 2)
    path += `${pen}${x.toFixed(1)},${y.toFixed(1)}`
    pen = "L"
  })

  return path
}

export const useTrend = id => {
  const chart = useChart()
  const payload = usePayload()

  return useMemo(() => getTrend(chart, id), [chart, payload, id])
}

const Trend = ({ trend, color, width = 64, height = 18 }) => {
  const path = useMemo(() => makeTrendPath(trend, width, height), [trend, width, height])

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
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default Trend
