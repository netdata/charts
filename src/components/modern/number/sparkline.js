import styled from "styled-components"
import { Box, getColor } from "@netdata/netdata-ui"
import { radius } from "@/components/modern/tokens"

const viewHeight = 100
const topPad = 6

const resolve = color => props => getColor(color)(props)

const Line = styled.path`
  fill: none;
  stroke: ${({ tint }) => resolve(tint)};
  stroke-width: 1.75px;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
`

const FlatLine = styled(Line)`
  stroke-width: 1.5px;
  stroke-opacity: 0.55;
`

const Stop = styled.stop`
  stop-color: ${({ tint }) => resolve(tint)};
`

const Marker = styled(Box).attrs({
  position: "absolute",
  width: 1.5,
  height: 1.5,
  round: radius.pill,
})`
  margin: -3px 0 0 -3px;
  background: ${({ tint }) => resolve(tint)};
  box-shadow: 0 0 0 2px ${getColor("cardBackground")};
  pointer-events: none;
`

const StartMarker = styled(Marker)`
  background: ${getColor("cardBackground")};
  box-shadow: inset 0 0 0 1.5px ${({ tint }) => resolve(tint)};
`

const flatTop = 62

const toPercent = (part, whole) => `${(part / whole) * 100}%`

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

const Sparkline = ({ values, color, id, height, markerIndex, flat = false }) => {
  if (!values || values.length < 2) return null

  const { line, area, y } = makePaths(values)
  if (!line) return null

  const width = values.length - 1
  const tint = flat ? "textLite" : color
  const top = value => (flat ? `${flatTop}%` : toPercent(y(value), viewHeight))
  const startIndex = values.findIndex(value => typeof value === "number")
  const marker = values[markerIndex]
  const gradientId = `modern-number-spark-${id}`

  return (
    <Box
      position="relative"
      width="100%"
      height={`${height}px`}
      data-testid="modernNumberSpark"
      data-flat={flat || undefined}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${viewHeight}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        {flat ? (
          <FlatLine d={`M0,${flatTop} L${width},${flatTop}`} tint={tint} strokeDasharray="3 3" />
        ) : (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" tint={color} stopOpacity={0.4} />
                <Stop offset="100%" tint={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <Line d={line} tint={color} />
          </>
        )}
      </svg>
      {startIndex !== markerIndex && (
        <StartMarker
          tint={tint}
          data-testid="modernNumberSparkStart"
          style={{ left: toPercent(startIndex, width), top: top(values[startIndex]) }}
        />
      )}
      {typeof marker === "number" && (
        <Marker
          tint={tint}
          data-testid="modernNumberSparkMarker"
          style={{ left: toPercent(markerIndex, width), top: top(marker) }}
        />
      )}
    </Box>
  )
}

export default Sparkline
