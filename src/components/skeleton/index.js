import React, { useId } from "react"
import { useColor, useLoadingColor } from "@/components/provider"

export const useSkeletonColors = () => {
  const track = useColor("themeSkeleton")
  const grid = useColor("themeSkeletonGrid")
  const loading = useLoadingColor("themeSkeleton")

  return { track: loading === "themeSkeleton" ? track : loading, grid }
}

const useGradientId = () => `skeleton${useId().replace(/[^a-zA-Z0-9]/g, "")}`

const FadeGradient = ({ id, color }) => (
  <defs>
    <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stopColor={color} />
      <stop offset="1" stopColor={color} stopOpacity="0" />
    </linearGradient>
  </defs>
)

const horizon = (() => {
  const steps = 48
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const y = 58 - 12 * Math.sin(t * Math.PI * 1.6 + 0.6) - 6 * Math.sin(t * Math.PI * 4.2 + 1.1)
    return `${(t * 200).toFixed(1)},${y.toFixed(1)}`
  })
  const line = `M${points.join(" L")}`
  return { line, area: `${line} L200,100 L0,100 Z` }
})()

const gridLines = [1, 34, 67, 99]

export const HorizonSkeleton = props => {
  const { track, grid } = useSkeletonColors()
  const id = useGradientId()

  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="none" {...props}>
      <FadeGradient id={id} color={track} />
      {gridLines.map(y => (
        <line
          key={y}
          x1="0"
          x2="200"
          y1={y}
          y2={y}
          stroke={grid}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <path d={horizon.area} fill={`url(#${id})`} />
      <path
        d={horizon.line}
        fill="none"
        stroke={track}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export const BlockSkeleton = props => {
  const { track } = useSkeletonColors()
  const id = useGradientId()

  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="none" {...props}>
      <FadeGradient id={id} color={track} />
      <rect width="200" height="100" rx="4" fill={`url(#${id})`} />
    </svg>
  )
}

const polar = (cx, cy, r, angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]

export const arcPath = (cx, cy, r, from, to) => {
  const [x0, y0] = polar(cx, cy, r, from)
  const [x1, y1] = polar(cx, cy, r, to)
  return `M${x0},${y0} A${r},${r} 0 ${to - from > Math.PI ? 1 : 0} 1 ${x1},${y1}`
}

const fullRing = { from: -Math.PI / 2, to: Math.PI * 1.4999 }
const gaugeArc = { from: Math.PI * 0.75, to: Math.PI * 2.25 }

export const ReadoutPills = ({ cx, cy, scale = 1, color }) => (
  <>
    <rect
      x={cx - 16 * scale}
      y={cy - 5 * scale}
      width={32 * scale}
      height={10 * scale}
      rx={5 * scale}
      fill={color}
    />
    <rect
      x={cx - 10 * scale}
      y={cy + 9 * scale}
      width={20 * scale}
      height={4 * scale}
      rx={2 * scale}
      fill={color}
    />
  </>
)

export const RingSkeleton = ({ gauge = false, thickness = 5, readout = true, ...props }) => {
  const { track } = useSkeletonColors()
  const { from, to } = gauge ? gaugeArc : fullRing
  const r = 50 - thickness / 2 - 1

  return (
    <svg viewBox="0 0 100 100" {...props}>
      <path
        d={arcPath(50, 50, r, from, to)}
        fill="none"
        stroke={track}
        strokeWidth={thickness}
        strokeLinecap={gauge ? "round" : "butt"}
      />
      {readout && <ReadoutPills cx={50} cy={gauge ? 48 : 46} scale={0.9} color={track} />}
    </svg>
  )
}
