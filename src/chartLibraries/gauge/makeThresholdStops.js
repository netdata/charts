const EPSILON = 1e-6

const clamp = (value, low, high) => Math.max(Math.min(value, high), low)

export default (thresholds, min, max, themeIndex = 0, baseColor) => {
  if (!Array.isArray(thresholds) || !thresholds.length || max === min) return undefined

  const rows = thresholds
    .filter(t => t && typeof t.from === "number" && Array.isArray(t.color))
    .filter(t => t.from <= max)
    .sort((a, b) => a.from - b.from)

  if (!rows.length) return undefined

  const deduped = rows.reduce((acc, row) => {
    const prev = acc[acc.length - 1]
    if (prev && prev.from === row.from) acc[acc.length - 1] = row
    else acc.push(row)
    return acc
  }, [])

  const stops = deduped.map((row, i) => {
    const hex = row.color[themeIndex] || row.color[0]
    const next = deduped[i + 1]
    if (!next) return [1, hex]
    return [clamp((next.from - min) / (max - min), 0, 1) - EPSILON, hex]
  })

  if (baseColor && deduped[0].from > min) {
    const basePct = clamp((deduped[0].from - min) / (max - min), 0, 1) - EPSILON
    return [[basePct, baseColor], ...stops]
  }

  return stops
}
