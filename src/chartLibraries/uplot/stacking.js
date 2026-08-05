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
