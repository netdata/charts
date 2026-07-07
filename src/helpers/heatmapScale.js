import scalableUnits, { keys as scalableUnitKeys } from "@/helpers/units/scalableUnits"

const heatmapValueRegex = /^\d*\.?\d+$/
const heatmapInfRegex = /^\+inf$/i
const heatmapPrefixRegex = /^.+_(\d*\.?\d+|\+[Ii]nf)$/

const getHeatmapValueLabel = value => {
  if (typeof value !== "string") return value

  return value.match(heatmapPrefixRegex)?.[1] || value
}

export const parseHeatmapValue = value => {
  const label = getHeatmapValueLabel(value)

  if (typeof label !== "string") return NaN
  if (heatmapInfRegex.test(label)) return Infinity
  if (!heatmapValueRegex.test(label)) return NaN

  return parseFloat(label)
}

export const isHeatmapNumeric = values =>
  values.every(value => !isNaN(parseHeatmapValue(value)))

export const isHeatmapBinary = values => {
  let hasBinaryCandidate = false

  return values.every(value => {
    const parsed = parseHeatmapValue(value)

    if (!isFinite(parsed) || parsed <= 1) return true

    hasBinaryCandidate = true

    return Number.isInteger(parsed) && parsed > 0 && Number.isInteger(Math.log2(parsed))
  }) && hasBinaryCandidate
}

export const detectHeatmapScale = values => {
  if (!values.length || !isHeatmapNumeric(values)) return null

  return isHeatmapBinary(values) ? "binary" : "num"
}

export const sortHeatmapValues = values => {
  if (!isHeatmapNumeric(values)) return null

  return values
    .map((value, index) => ({ value, index, parsed: parseHeatmapValue(value) }))
    .sort((a, b) => a.parsed - b.parsed || a.index - b.index)
    .map(({ value }) => value)
}

const getScaleEntries = scale =>
  (scalableUnitKeys[scale] || []).map(prefix => ({
    prefix: prefix === "1" ? "" : prefix,
    divider: prefix === "1" ? 1 : scalableUnits[scale][prefix],
  }))

const formatNumber = value => {
  if (value > 0 && value < 0.01) return parseFloat(value.toPrecision(3)).toString()

  return parseFloat(value.toFixed(2)).toString()
}

export const formatScaledValue = (value, scale) => {
  if (!value) return "0"

  const entries = getScaleEntries(scale)
  const entry = entries.reduce(
    (selected, candidate) =>
      candidate.divider <= value && candidate.divider > selected.divider ? candidate : selected,
    { prefix: "", divider: 0 }
  )

  if (!entry.divider) return formatNumber(value)

  return `${formatNumber(value / entry.divider)}${entry.prefix}`
}

export const formatHeatmapLabel = (value, scale) => {
  const label = getHeatmapValueLabel(value)

  if (typeof label !== "string") return value
  if (heatmapInfRegex.test(label)) return "+Inf"
  if (!scale) return label

  const parsed = parseHeatmapValue(label)

  if (isNaN(parsed)) return label

  return formatScaledValue(parsed, scale)
}
