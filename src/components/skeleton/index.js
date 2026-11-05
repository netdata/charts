import React, { useId } from "react"
import styled, { keyframes } from "styled-components"
import { Box, Flex } from "@netdata/netdata-ui"
import reducedMotion from "@/components/helpers/reducedMotion"
import { useColor, useLoadingColor } from "@/components/provider"

export const useSkeletonColors = () => {
  const track = useColor("themeSkeleton")
  const grid = useColor("themeSkeletonGrid")
  const spark = useColor("themeSkeletonSpark")
  const loading = useLoadingColor("themeSkeleton")

  return { track: loading === "themeSkeleton" ? track : loading, grid, spark }
}

const sparkSeconds = 4.8

const run = keyframes`
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
`

const glide = keyframes`
  from { transform: translateX(-60px); }
  to { transform: translateX(260px); }
`

const colorEase = "500ms linear"

export const SkeletonSvg = styled.svg`
  & path,
  & rect,
  & line {
    transition:
      fill ${colorEase},
      stroke ${colorEase};
  }

  & stop {
    transition: stop-color ${colorEase};
  }

  ${reducedMotion("& path, & rect, & line, & stop { transition: none; }")}
`

const CometPath = styled.path`
  animation: ${run} ${sparkSeconds}s linear infinite;
  ${reducedMotion("opacity: 0;")}
`

const SweepBand = styled.rect`
  animation: ${glide} ${sparkSeconds}s ease-in-out infinite;
  ${reducedMotion("opacity: 0;")}
`

export const Comet = ({ d, width, color, nonScaling = false }) => {
  if (!color) return null

  const effect = nonScaling ? "non-scaling-stroke" : undefined

  return (
    <g fill="none" strokeLinecap="butt" pointerEvents="none" data-testid="skeleton-comet">
      <CometPath
        d={d}
        stroke={color}
        strokeOpacity="0.12"
        strokeWidth={width}
        pathLength="100"
        strokeDasharray="16 84"
        vectorEffect={effect}
      />
      <CometPath
        d={d}
        stroke={color}
        strokeOpacity="0.3"
        strokeWidth={width}
        pathLength="100"
        strokeDasharray="0 13 3 84"
        vectorEffect={effect}
      />
    </g>
  )
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
  const { track, grid, spark } = useSkeletonColors()
  const id = useGradientId()

  return (
    <SkeletonSvg viewBox="0 0 200 100" preserveAspectRatio="none" {...props}>
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
      <Comet d={horizon.line} width="1.5" color={spark} nonScaling />
    </SkeletonSvg>
  )
}

export const BlockSkeleton = props => {
  const { track, spark } = useSkeletonColors()
  const id = useGradientId()
  const bandId = `${id}band`
  const clipId = `${id}clip`

  return (
    <SkeletonSvg viewBox="0 0 200 100" preserveAspectRatio="none" {...props}>
      <FadeGradient id={id} color={track} />
      <defs>
        <linearGradient id={bandId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={spark} stopOpacity="0" />
          <stop offset="0.5" stopColor={spark} stopOpacity="0.12" />
          <stop offset="1" stopColor={spark} stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect width="200" height="100" rx="4" />
        </clipPath>
      </defs>
      <rect width="200" height="100" rx="4" fill={`url(#${id})`} />
      {spark && (
        <g clipPath={`url(#${clipId})`} data-testid="skeleton-sweep">
          <SweepBand width="60" height="100" fill={`url(#${bandId})`} />
        </g>
      )}
    </SkeletonSvg>
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
  const { track, spark } = useSkeletonColors()
  const { from, to } = gauge ? gaugeArc : fullRing
  const r = 50 - thickness / 2 - 1
  const d = arcPath(50, 50, r, from, to)

  return (
    <SkeletonSvg viewBox="0 0 100 100" {...props}>
      <path
        d={d}
        fill="none"
        stroke={track}
        strokeWidth={thickness}
        strokeLinecap={gauge ? "round" : "butt"}
      />
      <Comet d={d} width={thickness} color={spark} />
      {readout && <ReadoutPills cx={50} cy={gauge ? 48 : 46} scale={0.9} color={track} />}
    </SkeletonSvg>
  )
}

const slide = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
`

const Shine = styled(Box).attrs({ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 })`
  pointer-events: none;
  background: linear-gradient(90deg, transparent, ${({ spark }) => spark}, transparent);
  opacity: 0.12;
  animation: ${slide} ${sparkSeconds}s ease-in-out infinite;
  ${reducedMotion("display: none;")}
`

const BoneBase = styled(Box).attrs({ position: "relative", overflow: "hidden" })`
  flex: none;
  background: ${({ tone }) => tone};
  transition: background-color ${colorEase};
  ${reducedMotion("transition: none;")}
`

export const Bone = ({ round = 1, ...rest }) => {
  const { track, spark } = useSkeletonColors()
  return (
    <BoneBase tone={track} round={round} {...rest}>
      <Shine spark={spark} />
    </BoneBase>
  )
}

const barWidths = ["92%", "74%", "58%", "40%", "26%"]

export const BarsSkeleton = () => (
  <Flex column gap={1} padding={[1, 2]} width="100%" data-testid="barsSkeleton">
    {barWidths.map(width => (
      <Bone key={width} width={width} height={6} />
    ))}
  </Flex>
)

const nameWidths = ["68%", "52%", "60%", "44%", "56%", "38%"]

export const TableRowsSkeleton = ({ columns = 4, rows = 6 }) => (
  <Flex column gap={2} padding={[2, 0]} width="100%" data-testid="tableRowsSkeleton">
    {nameWidths.slice(0, rows).map(width => (
      <Flex key={width} alignItems="center" gap={3} height={5}>
        <Bone width={2} height={2} round={true} />
        <Flex flex>
          <Bone width={width} height={2} />
        </Flex>
        {Array.from({ length: columns }, (_, index) => (
          <Bone key={index} width={10} height={2} />
        ))}
      </Flex>
    ))}
  </Flex>
)

export const NumberSkeleton = () => (
  <Flex
    column
    flex
    alignItems="center"
    justifyContent="center"
    gap={2}
    width="100%"
    data-testid="numberSkeleton"
  >
    <Bone width="45%" height={12} round={2} />
    <Bone width="20%" height={3} />
  </Flex>
)
