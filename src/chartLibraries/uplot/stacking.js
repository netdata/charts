const accumulate = ({ columns, rows, getValue, isVisible }) => {
  const positive = new Array(rows).fill(0)
  const negative = new Array(rows).fill(0)
  const bounds = new Array(columns).fill(null)

  for (let index = columns - 1; index >= 0; index--) {
    if (isVisible && !isVisible(index)) continue

    const columnBounds = new Array(rows)

    for (let row = 0; row < rows; row++) {
      const value = getValue(row, index)

      if (value == null || !Number.isFinite(value)) {
        columnBounds[row] = null
        continue
      }

      const negativeValue = value < 0
      const base = negativeValue ? negative[row] : positive[row]
      const end = base + value

      if (negativeValue) negative[row] = end
      else positive[row] = end

      columnBounds[row] = [base, end]
    }

    bounds[index] = columnBounds
  }

  return bounds
}

export const getStackBounds = (data, columns, isVisible) =>
  accumulate({
    columns: columns.length,
    rows: data.length,
    getValue: (row, index) => data[row][index + 1],
    isVisible: isVisible && (index => isVisible(columns[index], index)),
  })

export const getSeriesStackBounds = (seriesData, isVisible) =>
  accumulate({
    columns: seriesData.length - 1,
    rows: seriesData[0]?.length || 0,
    getValue: (row, index) => seriesData[index + 1][row],
    isVisible,
  })

export const getStackSegments = (series, length) => {
  const segments = []
  let start = 0

  while (start < length) {
    if (!series[start]) {
      start++
      continue
    }

    let end = start
    while (end + 1 < length && series[end + 1]) end++

    segments.push([start, end])
    start = end + 1
  }

  return segments
}

export const getStackValueRange = stackBounds => {
  let min = 0
  let max = 0

  stackBounds.forEach(bounds => {
    if (!bounds) return

    bounds.forEach(bound => {
      if (!bound) return

      const end = bound[1]
      if (end < min) min = end
      if (end > max) max = end
    })
  })

  return [min, max]
}

const maxRowsPerPixel = 6

const chordDeviation = (columns, index, first, last, progress) => {
  let deviation = 0

  for (let c = 0; c < columns.length; c++) {
    const bounds = columns[c]
    const from = bounds?.[first]
    const at = bounds?.[index]
    const to = bounds?.[last]

    if (!from || !at || !to) return Infinity

    const expectedBase = from[0] + (to[0] - from[0]) * progress
    const expectedEnd = from[1] + (to[1] - from[1]) * progress

    deviation = Math.max(deviation, Math.abs(at[0] - expectedBase), Math.abs(at[1] - expectedEnd))
  }

  return deviation
}

const reduceBucket = (target, bucket, columns) => {
  if (!bucket.length) return

  if (bucket.length <= maxRowsPerPixel) {
    for (let i = 0; i < bucket.length; i++) target.push(bucket[i])
    return
  }

  const first = bucket[0]
  const last = bucket[bucket.length - 1]
  const kept = new Set([0, bucket.length - 1])
  const candidates = []

  for (let i = 1; i < bucket.length - 1; i++) {
    const progress = (bucket[i] - first) / (last - first)
    candidates.push({ i, deviation: chordDeviation(columns, bucket[i], first, last, progress) })
  }

  candidates
    .sort((a, b) => b.deviation - a.deviation || a.i - b.i)
    .slice(0, maxRowsPerPixel - kept.size)
    .forEach(({ i }) => kept.add(i))

  Array.from(kept)
    .sort((a, b) => a - b)
    .forEach(i => target.push(bucket[i]))
}

export const selectStackRows = (columns, getX, start, end, plotWidth) => {
  const count = end - start + 1
  if (!Number.isFinite(plotWidth) || plotWidth <= 0 || count <= plotWidth * 2) return null

  const rows = []
  let bucket = []
  let pixel = null

  for (let row = start; row <= end; row++) {
    const x = getX(row)

    if (!Number.isFinite(x)) {
      reduceBucket(rows, bucket, columns)
      bucket = []
      pixel = null
      rows.push(row)
      continue
    }

    const nextPixel = Math.round(x)
    if (pixel !== null && nextPixel !== pixel) {
      reduceBucket(rows, bucket, columns)
      bucket = []
    }

    pixel = nextPixel
    bucket.push(row)
  }

  reduceBucket(rows, bucket, columns)

  return rows
}
