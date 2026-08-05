// dygraph walks the series from last to first — "because if they're stacked that's how we
// accumulate the values" (dygraphs/src/dygraph.js:2249-2253) — so the last visible dimension sits at
// the bottom of the stack, and hidden ones are skipped before a base is chosen (:2254). Positive and
// negative values get separate accumulators (dygraph/divergingStack.js:92) so mixed-sign series
// diverge from zero instead of cancelling each other out.
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

// the payload is row-major: data[row][column + 1]
export const getStackBounds = (data, columns, isVisible) =>
  accumulate({
    columns: columns.length,
    rows: data.length,
    getValue: (row, index) => data[row][index + 1],
    isVisible: isVisible && (index => isVisible(columns[index], index)),
  })

// uPlot keeps series column-major: data[series + 1][row]
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

// Deliberately unlike dygraph, which ranges over the stack ends alone
// (dygraph/divergingStack.js:100-107) and so renders a stack of 10 + 20 as [20, 30] — the bottom
// band falls entirely below the axis and the visible areas stop encoding their magnitudes. A stacked
// chart is about composition, so zero stays in range. Only the ends are scanned; every base is
// itself an end of the band below, or zero.
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
