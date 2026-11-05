export const formatPercent = value => {
  if (typeof value !== "number" || Number.isNaN(value)) return value
  if (value === 0) return "0"
  if (value < 0.1) return "<0.1%"
  if (value < 10) return `${Math.round(value * 10) / 10}%`
  return `${Math.round(value)}%`
}

export const clampPercent = value =>
  typeof value !== "number" || Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, value))
