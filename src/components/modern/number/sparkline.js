import React from "react"
import styled from "styled-components"
import { Box, getColor } from "@netdata/netdata-ui"

const viewHeight = 100
const topPad = 6

const resolve = color => props => getColor(color)(props)

const Line = styled.path`
  fill: none;
  stroke: ${({ $color }) => resolve($color)};
  stroke-width: 1.5px;
  vector-effect: non-scaling-stroke;
`

const Stop = styled.stop`
  stop-color: ${({ $color }) => resolve($color)};
`

const Marker = styled(Box)`
  position: absolute;
  width: 6px;
  height: 6px;
  margin: -3px 0 0 -3px;
  border-radius: 999px;
  background: ${({ $color }) => resolve($color)};
  box-shadow: 0 0 0 2px ${getColor("mainChartBg")};
  pointer-events: none;
`

// Runs of consecutive numbers; gaps (nulls) break the line instead of being drawn as zero.
export const toRuns = values =>
  values.reduce((runs, value, index) => {
    if (value === null) return runs
    const last = runs[runs.length - 1]
    if (last && last[last.length - 1][0] === index - 1) last.push([index, value])
    else runs.push([[index, value]])
    return runs
  }, [])

export const makeScale = values => {
  const numbers = values.filter(value => value !== null)
  if (!numbers.length) return null

  const max = Math.max(...numbers)
  const low = Math.min(...numbers)
  // Leave headroom under the lowest point so the area never collapses onto the bottom edge.
  const min = low - (max - low) * 0.1
  const span = max - min || 1

  return value => topPad + (1 - (value - min) / span) * (viewHeight - topPad)
}

export const makePaths = values => {
  const y = makeScale(values)
  if (!y) return { line: "", area: "" }

  const runs = toRuns(values)
  const line = runs
    .map(run => run.map(([x, v], i) => `${i ? "L" : "M"}${x},${y(v)}`).join(" "))
    .join(" ")
  const area = runs
    .map(run => {
      const path = run.map(([x, v], i) => `${i ? "L" : "M"}${x},${y(v)}`).join(" ")
      const first = run[0][0]
      const last = run[run.length - 1][0]
      return `${path} L${last},${viewHeight} L${first},${viewHeight} Z`
    })
    .join(" ")

  return { line, area, y }
}

const Sparkline = ({ values, color, id, height, markerIndex }) => {
  if (!values || values.length < 2) return null

  const { line, area, y } = makePaths(values)
  if (!line) return null

  const width = values.length - 1
  const marker = values[markerIndex]
  const gradientId = `modern-number-spark-${id}`

  return (
    <Box position="relative" width="100%" height={`${height}px`} data-testid="modernNumberSpark">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${viewHeight}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" $color={color} stopOpacity={0.35} />
            <Stop offset="100%" $color={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <Line d={line} $color={color} />
      </svg>
      {typeof marker === "number" && (
        <Marker
          $color={color}
          data-testid="modernNumberSparkMarker"
          style={{
            left: `${(markerIndex / width) * 100}%`,
            top: `${(y(marker) / viewHeight) * 100}%`,
          }}
        />
      )}
    </Box>
  )
}

export default Sparkline
