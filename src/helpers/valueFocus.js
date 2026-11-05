import { formatReadout, readoutRoundsToZero } from "@/components/modern/format"
import { getAlias } from "@/helpers/units"

export const valueFocusOptions = [
  { value: "totals", label: "Totals", question: "which has the most?" },
  { value: "changes", label: "Changes", question: "did anything just change?" },
  { value: "trends", label: "Trends", question: "both, and the shape" },
]

const allModes = valueFocusOptions.map(({ value }) => value)
const fallbackChain = ["trends", "changes", "totals"]

export const valueFocusSupport = { number: allModes, gauge: allModes, table: allModes }

export const valueFocusDefaults = { number: "trends", gauge: "trends", table: "trends" }

const emptyModes = []

export const getSupportedValueFocus = (chartType, support = valueFocusSupport) =>
  support[chartType] || emptyModes

export const getDefaultValueFocus = (chartType, support = valueFocusSupport) =>
  getSupportedValueFocus(chartType, support).length
    ? valueFocusDefaults[chartType] || fallbackChain[0]
    : null

const isMode = value => fallbackChain.includes(value)

export const resolveValueFocus = (
  chartType,
  requested,
  { inherited, support = valueFocusSupport } = {}
) => {
  const supported = getSupportedValueFocus(chartType, support)
  if (!supported.length) return null

  const wanted = isMode(requested)
    ? requested
    : isMode(inherited)
      ? inherited
      : getDefaultValueFocus(chartType, support)
  const start = fallbackChain.indexOf(wanted)
  const below = fallbackChain.slice(start).find(mode => supported.includes(mode))
  if (below) return below

  return fallbackChain
    .slice(0, start)
    .reverse()
    .find(mode => supported.includes(mode))
}

export const noiseShare = 0.01
export const edgePoints = 3

const isFiniteNumber = value => typeof value === "number" && Number.isFinite(value)

const average = list => list.reduce((sum, value) => sum + value, 0) / list.length

const analyses = new WeakMap()

const analyze = values => {
  const cached = analyses.get(values)
  if (cached) return cached

  const points = []
  const counts = new Array(values.length)
  let low = Infinity
  let high = -Infinity

  for (let index = 0; index < values.length; index++) {
    const value = values[index]
    if (isFiniteNumber(value)) {
      points.push(value)
      if (value < low) low = value
      if (value > high) high = value
    }
    counts[index] = points.length
  }

  const scale = points.length ? Math.max(Math.abs(low), Math.abs(high)) : -Infinity
  const analysis = {
    points,
    counts,
    scale,
    varied: points.length >= 2 && scale > 0 && high - low >= noiseShare * scale,
  }
  analyses.set(values, analysis)
  return analysis
}

export const getWindowDelta = (values = [], { index, compare } = {}) => {
  const end = Number.isInteger(index) && index >= 0 && index < values.length ? index : null
  if (end !== null && !isFiniteNumber(values[end])) return null

  const analysis = analyze(values)
  const { points } = analysis
  const count = end === null ? points.length : analysis.counts[end]
  const hasCompare = isFiniteNumber(compare)
  if (count < (hasCompare ? 1 : 2)) return null

  const to = points[count - 1]
  const from = hasCompare ? compare : points[0]
  const delta = to - from

  const edge = hasCompare ? edgePoints : Math.max(1, Math.min(edgePoints, Math.floor(count / 2)))
  const start = hasCompare ? compare : average(points.slice(0, edge))
  const finish = average(points.slice(Math.max(0, count - edge), count))
  const scale = Math.max(analysis.scale, hasCompare ? Math.abs(compare) : 0)

  if (!delta || !(scale > 0) || Math.abs(finish - start) < noiseShare * scale) return null

  return { from, to, delta }
}

export const isWindowActive = (values = []) => analyze(values).varied

export const minusSign = "−"

export const isPercentUnit = unit => typeof unit === "string" && getAlias(unit) === "%"

export const formatSignedDelta = (chart, delta, { dimensionId, unitAttributes, unit } = {}) => {
  if (!isFiniteNumber(delta) || delta === 0) return null

  if (readoutRoundsToZero(chart, Math.abs(delta), { dimensionId, unitAttributes })) return null

  const text = formatReadout(chart, Math.abs(delta), { dimensionId, unitAttributes })

  return `${delta > 0 ? "+" : minusSign}${text}${isPercentUnit(unit) ? "%" : ""}`
}

const durationSteps = [
  { seconds: 86400, label: "d" },
  { seconds: 3600, label: "h" },
  { seconds: 60, label: "min" },
]

export const formatWindowDuration = seconds => {
  if (!isFiniteNumber(seconds) || seconds <= 0) return ""

  const step = durationSteps.find(({ seconds: size }) => seconds >= size)
  if (!step) return `${Math.round(seconds)} s`

  return `${Math.round(seconds / step.seconds)} ${step.label}`
}

export const getWindowSeconds = chart => {
  const { all = [] } = chart.getPayload() || {}
  if (all.length < 2) return 0

  const step = all[1][0] - all[0][0]
  return (all[all.length - 1][0] - all[0][0] + step) / 1000
}

const inWindow = (text, window) => (window ? `${text} in ${window}` : text)

const directionLabels = { up: "Up", down: "Down" }

export const describeWindowChange = (
  chart,
  values = [],
  { dimensionId, unitAttributes, unit, index, compare } = {}
) => {
  const { points } = analyze(values)
  if (!points.length) return null

  const window = formatWindowDuration(getWindowSeconds(chart))
  const format = value => formatReadout(chart, value, { dimensionId, unitAttributes })
  const change = getWindowDelta(values, { index, compare })
  const delta =
    change && formatSignedDelta(chart, change.delta, { dimensionId, unitAttributes, unit })

  if (!delta) {
    const shown =
      Number.isInteger(index) && isFiniteNumber(values[index])
        ? values[index]
        : points[points.length - 1]
    const text = inWindow("no change", window)
    const steady = format(shown)
    const varied = analyze(values).varied
    return {
      moved: false,
      varied,
      direction: null,
      delta: null,
      from: steady,
      to: steady,
      window,
      text,
      detail: `${steady} → ${steady}, ${text}`,
      label: `${inWindow("No change", window)}, ${varied ? "now" : "steady"} at ${steady}`,
    }
  }

  const direction = change.delta > 0 ? "up" : "down"
  const from = format(change.from)
  const to = format(change.to)
  const text = inWindow(delta, window)
  return {
    moved: true,
    varied: true,
    direction,
    delta,
    from,
    to,
    window,
    text,
    detail: `${from} → ${to}, ${text}`,
    label: `${inWindow(`${directionLabels[direction]} ${delta.slice(1)}`, window)}, from ${from} to ${to}`,
  }
}
