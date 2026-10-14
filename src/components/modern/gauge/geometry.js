export const viewBox = { width: 240, height: 200 }

export const center = { cx: 120, cy: 118 }

export const radius = 92

export const zoneRadius = radius + 13

export const startAngle = (Math.PI * 5) / 6

export const endAngle = (Math.PI * 13) / 6

export const clamp = (value, low, high) => Math.max(Math.min(value, high), low)

export const toFraction = (value, min, max) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0
  if (typeof min !== "number" || typeof max !== "number" || max <= min) return 0
  return clamp((value - min) / (max - min), 0, 1)
}

export const fractionToAngle = fraction =>
  startAngle + (endAngle - startAngle) * clamp(fraction, 0, 1)

export const polar = (cx, cy, r, angle) => [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]

export const arcPath = (cx, cy, r, a0, a1) => {
  const [x0, y0] = polar(cx, cy, r, a0)
  const [x1, y1] = polar(cx, cy, r, a1)
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`
}

export const sumRow = row => {
  if (!Array.isArray(row)) return null
  const [, ...values] = row
  return values.reduce((acc, v = 0) => acc + v, 0)
}

export const sparklinePath = (values, { width, height, pad = 2 }) => {
  const points = values.filter(v => typeof v === "number" && !Number.isNaN(v))
  if (points.length < 2) return { line: "", area: "" }

  const low = Math.min(...points)
  const high = Math.max(...points)
  const span = high - low || 1
  const x = index => (index / (points.length - 1)) * width
  const y = value => pad + (1 - (value - low) / span) * (height - pad * 2)

  const line = points
    .map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(2)},${y(value).toFixed(2)}`)
    .join(" ")

  return { line, area: `${line} L${width},${height} L0,${height} Z` }
}

export const valueRadius = radius - 10

export const valueBaseline = 2

const charWidth = 0.6
const capHeight = 0.74
const unitGap = 3

export const unitFontSize = size => Math.min(16, Math.max(8, Math.round(size * 0.37)))

export const valueTextBox = (value, unit, size) => {
  const valueWidth = String(value ?? "").length * charWidth * size
  const unitText = String(unit ?? "")
  const unitWidth = unitText ? unitGap + unitText.length * charWidth * unitFontSize(size) : 0
  return { width: valueWidth + unitWidth, height: capHeight * size }
}

export const fitValueFontSize = (value, unit, { max = 44, min = 8 } = {}) => {
  for (let size = max; size > min; size -= 1) {
    const { width, height } = valueTextBox(value, unit, size)
    const top = valueBaseline + height
    if ((width / 2) ** 2 + top ** 2 <= valueRadius ** 2) return size
  }
  return min
}
